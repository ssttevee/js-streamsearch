import { MATCH, type Token } from './search.js';

export async function* iterateChunks(iter: AsyncIterable<Token>): AsyncIterableIterator<Uint8Array[]> {
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