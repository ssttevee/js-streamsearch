import { concat } from 'uint8arrays/concat';
import { toString } from 'uint8arrays/to-string';

import { iterateChunks } from './iterate-chunks.js';
import type { Token } from './search.js';

export async function* iterateStrings(iter: AsyncIterable<Token>): AsyncIterableIterator<string> {
    for await (const chunks of iterateChunks(iter)) {
        yield toString(concat(chunks));
    }
}
