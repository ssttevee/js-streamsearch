import { mergeArrays } from '@ssttevee/u8-utils';
import { StreamSearch, MATCH } from './search';

export function splitChunks(chunks: Uint8Array[], needle: Uint8Array | string): Uint8Array[] {
    const search = new StreamSearch(needle);

    const outchunks: Uint8Array[][] = [[]];
    for (const chunk of chunks) {
        for (const token of search.feed(chunk)) {
            if (token === MATCH) {
                outchunks.push([]);
            } else {
                outchunks[outchunks.length-1].push(token);
            }
        }
    }

    const end = search.end();
    outchunks[outchunks.length-1].push(end);

    return outchunks.map((chunks) => mergeArrays(...chunks));
}

export function split(buf: Uint8Array, needle: Uint8Array | string): Uint8Array[] {
    return splitChunks([buf], needle);
}

export * from './search';
export * from './readable';
