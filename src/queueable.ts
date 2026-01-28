import { StreamSearch, type Token } from "./search.js";

const EOQ = Symbol("End of Queue");

export class QueueableStreamSearch {
	private _search: StreamSearch;
	private _chunksQueue: Array<Uint8Array | typeof EOQ> = [];
	private _notify?: () => void;
	private _closed = false;

	public constructor(needle: Uint8Array | string) {
		this._search = new StreamSearch(needle);
	}

	public push(...chunks: Uint8Array[]): void {
		if (this._closed) {
			throw new Error("cannot call push after close");
		}

		this._chunksQueue.push(...chunks);
		if (this._notify) {
			this._notify();
		}
	}

	public close(): void {
		if (this._closed) {
			throw new Error("close was already called");
		}

		this._closed = true;
		this._chunksQueue.push(EOQ);
		if (this._notify) {
			this._notify();
		}
	}

	public async *[Symbol.asyncIterator](): AsyncIterableIterator<Token> {
		while (true) {
			let chunk: Uint8Array | typeof EOQ | undefined;
			while (!(chunk = this._chunksQueue.shift())) {
				await new Promise<void>((resolve) => (this._notify = resolve));
				this._notify = undefined;
			}

			if (chunk === EOQ) {
				break;
			}

			yield* this._search.feed(chunk);
		}

		const tail = this._search.end();
		if (tail.length) {
			yield tail;
		}
	}
}
