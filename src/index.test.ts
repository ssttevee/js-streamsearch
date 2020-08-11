import { arrayToString, stringToArray } from '@ssttevee/u8-utils';
import t from 'tap';

import { allStrings, arrayIterator, split } from './index';
import { ReadableStreamSearch } from './readable';
import { QueueableStreamSearch } from './queueable';
import { Token } from './search';

type Test = typeof t.Test.prototype;

async function testSuite(t: Test, makeIter: (needle: string, chunks: string[]) => AsyncIterable<Token>, needle: string, payload: string, expected: string[]): Promise<void> {
    await Promise.all([2, 3, 4, 5, 6].map(async (chunkSize: number) => {
        const chunks = Array.from({ length: Math.ceil(payload.length / chunkSize) }, (_: undefined, i: number) => payload.substr(i * chunkSize, chunkSize));
        t.test(`chunk size ${chunkSize}`, async function (t: Test): Promise<void> {
            t.deepEqual(
                await allStrings(makeIter(needle, chunks)),
                expected,
            );

            const iter = arrayIterator(makeIter(needle, chunks));
            for (let i = 0; i < expected.length; i++) {
                const { done, value } = await iter.next();
                t.notOk(done);
                t.equal(arrayToString(value), expected[i]);
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
                                value: stringToArray(s),
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
        s.push(...chunks.map(stringToArray));
        s.close();
        return s;
    }

    await testSuite(t, makeIter, 'z', '12345z67890', ['12345', '67890']);
    await testSuite(t, makeIter, 'ab', '12a45678a', ['12a45678a']);
});

t.test('split', function (t: Test): void {
    const text = 'hello world foo bar';

    t.deepEqual(
        split(stringToArray(text), ' ').map(arrayToString),
        text.split(' '),
    );

    t.end();
});
