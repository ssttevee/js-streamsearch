import { concat } from "uint8arrays/concat";

import { iterateChunks } from "./iterate-chunks.js";
import type { Token } from "./search.js";

export async function* iterateChunksConcatted(
	iter: AsyncIterable<Token>,
): AsyncIterableIterator<Uint8Array> {
	for await (const chunk of iterateChunks(iter)) {
		yield concat(chunk);
	}
}
