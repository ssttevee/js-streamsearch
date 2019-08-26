/*
  Based heavily on the Streaming Boyer-Moore-Horspool C++ implementation
  by Hongli Lai at: https://github.com/FooBarWidget/boyer-moore-horspool
*/

import { arrayToString, stringToArray } from '@ssttevee/u8-utils';

type CharFunc = (index: number) => number;

function coerce(a: Uint8Array | CharFunc): CharFunc {
    if (a instanceof Uint8Array) {
        return (index: number) => a[index];
    }

    return a;
}

function jsmemcmp(
    buf1: Uint8Array | CharFunc,
    pos1: number,
    buf2: Uint8Array | CharFunc,
    pos2: number,
    len: number,
) {
    const fn1 = coerce(buf1);
    const fn2 = coerce(buf2);

    for (var i = 0; i < len; ++i) {
        if (fn1(pos1 + i) !== fn2(pos2 + i)) {
            return false;
        }
    }

    return true;
}

function createOccurenceTable(s: Uint8Array): number[] {
    // Populate occurrence table with analysis of the needle,
    // ignoring last letter.
    const table = new Array(256).fill(s.length);
    if (s.length > 1) {
        for (let i = 0; i < s.length - 1; i++) {
            table[s[i]] = s.length - 1 - i;
        }
    }

    return table;
}

export const MATCH = Symbol('Match');

type Token = Uint8Array | typeof MATCH;

export class StreamSearch {
    private _needle: Uint8Array;
    private _lastChar: number;
    private _occ: number[];

    private _lookbehind = new Uint8Array();

    public constructor(needle: Uint8Array | string, private _readableStream: ReadableStream<Uint8Array>) {
        if (typeof needle === 'string') {
            this._needle = needle = stringToArray(needle);
        } else {
            this._needle = needle;
        }

        this._lastChar = needle[needle.length - 1];
        this._occ = createOccurenceTable(needle);
    }

    public async drainStrings(): Promise<string[]> {
        const segments: string[] = [];
        for await (const value of this.strings()) {
            segments.push(value);
        }

        return segments;
    }

    public async *strings(): AsyncIterableIterator<string> {
        let segments: Uint8Array[] = [];
        for await (const value of this) {
            if (value === MATCH) {
                yield segments.map(arrayToString).join('');
                segments = [];
            } else {
                segments.push(value);
            }
        }

        yield segments.map(arrayToString).join('');
    }

    public async *[Symbol.asyncIterator](): AsyncIterableIterator<Token> {
        const reader = this._readableStream.getReader();
        try {
            while (true) {
                const { done, value: chunk } = await reader.read();
                if (done) {
                    break;
                }

                let pos = 0;
                let tokens: Token[];
                while (pos !== chunk.length) {
                    [pos, ...tokens] = this._feed(chunk, pos);

                    yield* tokens;
                }
            }

            if (this._lookbehind.length) {
                yield this._lookbehind
            }
        } finally {
            reader.releaseLock();
        }
    }

    private _feed(data: Uint8Array, buf_pos: number): [number, ...Token[]] {
        const tokens: Token[] = [];

        // Positive: points to a position in `data`
        //           pos == 3 points to data[3]
        // Negative: points to a position in the lookbehind buffer
        //           pos == -2 points to lookbehind[lookbehind_size - 2]
        let pos = -this._lookbehind.length;

        if (pos < 0) {
            // Lookbehind buffer is not empty. Perform Boyer-Moore-Horspool
            // search with character lookup code that considers both the
            // lookbehind buffer and the current round's haystack data.
            //
            // Loop until (condition 1)
            //   there is a match.
            // or until
            //   we've moved past the position that requires the
            //   lookbehind buffer. In this case we switch to the
            //   optimized loop.
            // or until (condition 3)
            //   the character to look at lies outside the haystack.
            while (pos < 0 && pos <= data.length - this._needle.length) {
                const ch = this._charAt(data, pos + this._needle.length - 1);

                if (ch === this._lastChar && this._memcmp(data, pos, this._needle.length - 1)) {
                    if (pos > -this._lookbehind.length) {
                        tokens.push(this._lookbehind.slice(0, this._lookbehind.length + pos));
                    }

                    tokens.push(MATCH);

                    this._lookbehind = new Uint8Array();

                    return [pos + this._needle.length, ...tokens];
                } else {
                    pos += this._occ[ch];
                }
            }

            // No match.

            if (pos < 0) {
                // There's too little data for Boyer-Moore-Horspool to run,
                // so we'll use a different algorithm to skip as much as
                // we can.
                // Forward pos until
                //   the trailing part of lookbehind + data
                //   looks like the beginning of the needle
                // or until
                //   pos == 0
                while (pos < 0 && !this._memcmp(data, pos, data.length - pos)) {
                    pos++;
                }
            }

            if (pos >= 0) {
                // Discard lookbehind buffer.
                tokens.push(this._lookbehind);
                this._lookbehind = new Uint8Array();
            } else {
                // Cut off part of the lookbehind buffer that has
                // been processed and append the entire haystack
                // into it.
                const bytesToCutOff = this._lookbehind.length + pos;

                if (bytesToCutOff > 0) {
                    // The cut off data is guaranteed not to contain the needle.
                    tokens.push(this._lookbehind.slice(0, bytesToCutOff));
                    this._lookbehind = this._lookbehind.slice(bytesToCutOff);
                }

                this._lookbehind = Uint8Array.from(new Array(this._lookbehind.length + data.length), (_, i) => this._charAt(data, i - this._lookbehind.length));

                return [data.length, ...tokens];
            }
        }

        pos += buf_pos;

        // Lookbehind buffer is now empty. Perform Boyer-Moore-Horspool
        // search with optimized character lookup code that only considers
        // the current round's haystack data.
        while (pos <= data.length - this._needle.length) {
            const ch = data[pos + this._needle.length - 1];

            if (ch === this._lastChar
                && data[pos] === this._needle[0]
                && jsmemcmp(this._needle, 0, data, pos, this._needle.length - 1)) {
                if (pos > buf_pos) {
                    tokens.push(data.slice(buf_pos, pos));
                }

                tokens.push(MATCH);

                return [pos + this._needle.length, ...tokens];
            } else {
                pos += this._occ[ch];
            }
        }

        // There was no match. If there's trailing haystack data that we cannot
        // match yet using the Boyer-Moore-Horspool algorithm (because the trailing
        // data is less than the needle size) then match using a modified
        // algorithm that starts matching from the beginning instead of the end.
        // Whatever trailing data is left after running this algorithm is added to
        // the lookbehind buffer.
        if (pos < data.length) {
            while (pos < data.length && (data[pos] !== this._needle[0]
                || !jsmemcmp(data, pos, this._needle, 0, data.length - pos))) {
                ++pos;
            }

            if (pos < data.length) {
                this._lookbehind = data.slice(pos);
            }
        }

        // Everything until pos is guaranteed not to contain needle data.
        if (pos > 0) {
            tokens.push(data.slice(buf_pos, pos < data.length ? pos : data.length));
        }

        return [data.length, ...tokens];
    }

    private _charAt(data: Uint8Array, pos: number): number {
        if (pos < 0) {
            return this._lookbehind[this._lookbehind.length + pos];
        }

        return data[pos];
    };

    private _memcmp(data: Uint8Array, pos: number, len: number): boolean {
        return jsmemcmp(this._charAt.bind(this, data), pos, this._needle, 0, len);
    };
}
