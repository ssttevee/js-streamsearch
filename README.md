[![codecov](https://codecov.io/gh/ssttevee/streamsearch/branch/master/graph/badge.svg)](https://codecov.io/gh/ssttevee/streamsearch)

# Description

This module is a port of [streamsearch](https://github.com/mscdex/streamsearch) for es modules using Web APIs, namely `ReadableStream` and `Uint8Array`.

# Example

```js
import { StreamSearch } from 'streamsearch';

const res = await fetch('https://httpbin.org/stream/10');
const search = new StreamSearch('\n', res.body);

for await (const str of search.strings()) {
    console.log(str);
}
```
