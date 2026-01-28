import { StreamSearch, type Token } from "./search.js";

export class ReadableStreamSearch {
	private _search: StreamSearch;

	public constructor(
		needle: Uint8Array | string,
		private _readableStream: ReadableStream<Uint8Array>,
	) {
		this._search = new StreamSearch(needle);
	}

	public async *[Symbol.asyncIterator](): AsyncIterableIterator<Token> {
		const reader = this._readableStream.getReader();
		try {
			while (true) {
				const result = await reader.read();
				if (result.done) {
					break;
				}

				yield* this._search.feed(result.value);
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
