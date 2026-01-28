import { iterateStrings } from "./iterate-strings.js";
import type { Token } from "./search.js";

/**
 * @deprecated Use the [Async Iterator Helpers](https://github.com/tc39/proposal-async-iterator-helpers). (e.g. `AsyncIterator.from(iterateStrings(...))`)
 */
export async function allStrings(
	iter: AsyncIterable<Token>,
): Promise<string[]> {
	const segments: string[] = [];
	for await (const value of iterateStrings(iter)) {
		segments.push(value);
	}

	return segments;
}

export * from "./iterate-chunks.js";
export * from "./iterate-chunks-concatted.js";
export * from "./iterate-strings.js";

export * from "./iterator.js";
export * from "./queueable.js";
export * from "./readable.js";
export * from "./search.js";
export * from "./split.js";
