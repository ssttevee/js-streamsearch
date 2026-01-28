import { concat } from 'uint8arrays/concat';

import { MATCH, StreamSearch } from './search.js';

export function split(chunks: Uint8Array | Uint8Array, needle: Uint8Array | string): Uint8Array[] {
    const search = new StreamSearch(needle);

    const outchunks: Uint8Array[][] = [[]];
    for (const chunk of Array.isArray(chunks) ? chunks : [chunks]) {
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
