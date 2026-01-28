import { StreamSearch, type Token } from './search.js';

export class IteratorStreamSearch {
    private _search: StreamSearch;

    public constructor(needle: Uint8Array | string, private _iter: AsyncIterable<Uint8Array>) {
        this._search = new StreamSearch(needle);
    }

    public async *[Symbol.asyncIterator](): AsyncIterableIterator<Token> {
        const it = this._iter[Symbol.asyncIterator]();
        while (true) {
            let result: IteratorResult<Uint8Array>;
            try {
                result = await it.next();
            } catch (error) {
                if (it.throw) {
                    result = await it.throw(error);
                } else {
                    throw error;
                }
            }

            if (result.done) {
                break;
            }

            yield *this._search.feed(result.value);
        }

        const tail = this._search.end();
        if (tail.length) {
            yield tail;
        }
    }
}