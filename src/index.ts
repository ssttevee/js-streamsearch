import { concat } from 'uint8arrays/concat';
import { toString } from 'uint8arrays/to-string';
import { MATCH, StreamSearch, type Token } from './search.js';

export function splitChunks(chunks: Uint8Array[], needle: Uint8Array | string): Uint8Array[] {
    const search = new StreamSearch(needle);

    const outchunks: Uint8Array[][] = [[]];
    for (const chunk of chunks) {
        for (const token of search.feed(chunk)) {
            if (token === MATCH) {
                outchunks.push([]);
            } else {
                outchunks[outchunks.length - 1].push(token);
            }
        }
    }

    const end = search.end();
    outchunks[outchunks.length - 1].push(end);

    return outchunks.map((chunks) => concat(chunks));
}

export function split(buf: Uint8Array, needle: Uint8Array | string): Uint8Array[] {
    return splitChunks([buf], needle);
}

export async function* chunksIterator(iter: AsyncIterable<Token>): AsyncIterableIterator<Uint8Array[]> {
    let chunks: Uint8Array[] = [];
    for await (const value of iter) {
        if (value === MATCH) {
            yield chunks;
            chunks = [];
        } else {
            chunks.push(value);
        }
    }

    yield chunks;
}

export async function* stringIterator(iter: AsyncIterable<Token>): AsyncIterableIterator<string> {
    for await (const chunk of arrayIterator(iter)) {
        yield toString(chunk);
    }
}

export async function allStrings(iter: AsyncIterable<Token>): Promise<string[]> {
    const segments: string[] = [];
    for await (const value of stringIterator(iter)) {
        segments.push(value);
    }

    return segments;
}

export async function* arrayIterator(iter: AsyncIterable<Token>): AsyncIterableIterator<Uint8Array> {
    for await (const chunk of chunksIterator(iter)) {
        yield concat(chunk);
    }
}

export * from './queueable.js';
export * from './readable.js';
export * from './search.js';
