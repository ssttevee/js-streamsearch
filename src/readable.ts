import { arrayToString, mergeArrays } from '@ssttevee/u8-utils';
import { StreamSearch, MATCH, Token } from './search';

export class ReadableStreamSearch {
    private _search: StreamSearch;

    public constructor(needle: Uint8Array | string, private _readableStream: ReadableStream<Uint8Array>) {
        this._search = new StreamSearch(needle);
    }

    public async *chunks(): AsyncIterableIterator<Uint8Array[]> {
        let chunks: Uint8Array[] = [];
        for await (const value of this) {
            if (value === MATCH) {
                yield chunks;
                chunks = [];
            } else {
                chunks.push(value);
            }
        }

        yield chunks;
    }

    public async allStrings(): Promise<string[]> {
        const segments: string[] = [];
        for await (const value of this.strings()) {
            segments.push(value);
        }

        return segments;
    }

    public async *strings(): AsyncIterableIterator<string> {
        for await (const chunk of this.chunks()) {
            yield chunk.map(arrayToString).join('');
        }
    }

    public async *arrays(): AsyncIterableIterator<Uint8Array> {
        for await (const chunk of this.chunks()) {
            yield mergeArrays(...chunk);
        }
    }

    public async *[Symbol.asyncIterator](): AsyncIterableIterator<Token> {
        const reader = this._readableStream.getReader();
        try {
            while (true) {
                const result = await reader.read();
                if (result.done) {
                    break;
                }

                yield *this._search.feed(result.value);
            }

            const tail = this._search.end();
            if (tail.length) {
                yield tail;
            }
        } finally {
            reader.releaseLock();
        }
    }
}