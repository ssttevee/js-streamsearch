[![codecov](https://codecov.io/gh/ssttevee/streamsearch/branch/master/graph/badge.svg)](https://codecov.io/gh/ssttevee/streamsearch)

# Description

This module is a port of [streamsearch](https://github.com/mscdex/streamsearch) for es modules using Web APIs, namely `ReadableStream` and `Uint8Array`.

Node's `stream.Readable` can be used with `IterableStreamSearch` class starting from [v11.14.0](https://nodejs.org/api/stream.html#readablesymbolasynciterator).

# Installation

```bash
npm install @ssttevee/streamsearch
```

# Example

```js
import { ReadableStreamSearch, iterateStrings } from '@ssttevee/streamsearch';

const res = await fetch('https://httpbin.org/stream/10');
const search = new ReadableStreamSearch('\n', res.body);

for await (const str of iterateStrings(search)) {
    console.log(str);
}
```

Each function can also be imported individually for bundling efficiency.

```js
import { iterateStrings } from '@ssttevee/streamsearch/iterate-strings';
import { IteratorStreamSearch } from '@ssttevee/streamsearch/iterator';
```

# API

## Classes

### `StreamSearch`

**Constructor:** `new StreamSearch(needle: Uint8Array | string)`

Base class that implements the Boyer-Moore-Horspool algorithm. Use `feed(chunk: Uint8Array)` to push data and `end()` to get remaining data. Returns an array of `Token` (either `Uint8Array` chunks or `MATCH` symbols).

### `IteratorStreamSearch`

**Constructor:** `new IteratorStreamSearch(needle: Uint8Array | string, iter: AsyncIterable<Uint8Array>)`

Wraps an async iterable (e.g., Node.js streams with `Symbol.asyncIterator`). Implements `AsyncIterable<Token>`.

### `QueueableStreamSearch`

**Constructor:** `new QueueableStreamSearch(needle: Uint8Array | string)`

Manual push-based interface. Use `push(...chunks: Uint8Array[])` to add data and `close()` when done. Implements `AsyncIterable<Token>`.

### `ReadableStreamSearch`

**Constructor:** `new ReadableStreamSearch(needle: Uint8Array | string, stream: ReadableStream<Uint8Array>)`

Wraps a Web `ReadableStream`. Implements `AsyncIterable<Token>`.

## Helper functions

### `iterateChunks(iter: AsyncIterable<Token>): AsyncIterableIterator<Uint8Array[]>`

Yields arrays of `Uint8Array` chunks between matches. Each match produces a separate array.

### `iterateChunksConcatted(iter: AsyncIterable<Token>): AsyncIterableIterator<Uint8Array>`

Like `iterateChunks` but concatenates each chunk array into a single `Uint8Array`.

### `iterateStrings(iter: AsyncIterable<Token>): AsyncIterableIterator<string>`

Yields UTF-8 decoded strings between matches.

### `split(chunks: Uint8Array | Uint8Array[], needle: Uint8Array | string): Uint8Array[]`

Synchronous split function. Returns an array of `Uint8Array` chunks split by the needle.
