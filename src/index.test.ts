import * as u8 from 'uint8arrays';
import t, { type Test } from 'tap';

import { allStrings, iterateChunksConcatted, split } from './index.js';
import { QueueableStreamSearch } from './queueable.js';
import { ReadableStreamSearch } from './readable.js';
import type { Token } from './search.js';

async function testSuite(t: Test, makeIter: (needle: string, chunks: string[]) => AsyncIterable<Token>, needle: string, payload: string, expected: string[]): Promise<void> {
    await Promise.all([2, 3, 4, 5, 6].map(async (chunkSize: number) => {
        const chunks = Array.from({ length: Math.ceil(payload.length / chunkSize) }, (_: undefined, i: number) => payload.substr(i * chunkSize, chunkSize));
        t.test(`chunk size ${chunkSize}`, async function (t: Test): Promise<void> {
            t.same(
                await allStrings(makeIter(needle, chunks)),
                expected,
            );

            const iter = iterateChunksConcatted(makeIter(needle, chunks));
            for (let i = 0; i < expected.length; i++) {
                const { done, value } = await iter.next();
                t.notOk(done);
                t.equal(u8.toString(value), expected[i]);
            }

            const { done, value } = await iter.next();
            t.ok(done);
            t.notOk(value);

            t.end();
        });
    }));
}

t.test('readable', async function (t: Test): Promise<void> {
    function makeIter(needle: string, chunks: string[]): ReadableStreamSearch {
        let i = 0;
        return new ReadableStreamSearch(needle, {
            getReader() {
                return {
                    async read() {
                        if (i < chunks.length) {
                            const s = chunks[i++];
                            return {
                                done: false,
                                value: u8.fromString(s),
                            };
                        } else {
                            return { done: true };
                        }
                    },
                    releaseLock() { },
                }
            }
        } as any);
    };

    await testSuite(t, makeIter, 'z', '12345z67890', ['12345', '67890']);
    await testSuite(t, makeIter, 'ab', '12a45678a', ['12a45678a']);
});

t.test('queueable', async function (t: Test): Promise<void> {
    function makeIter(needle: string, chunks: string[]): QueueableStreamSearch {
        const s = new QueueableStreamSearch(needle);
        s.push(...chunks.map((chunk) => u8.fromString(chunk)));
        s.close();
        return s;
    }

    await testSuite(t, makeIter, 'z', '12345z67890', ['12345', '67890']);
    await testSuite(t, makeIter, 'ab', '12a45678a', ['12a45678a']);
});

t.test('split', function (t: Test): void {
    const text = 'hello world foo bar';

    t.same(
        split(u8.fromString(text), ' ').map((chunk) => u8.toString(chunk)),
        text.split(' '),
    );

    t.end();
});
