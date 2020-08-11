import tape from 'tape-promise/tape';

import { makeStream } from '../testing/util';
import { ReadableStreamSearch } from './readable';
import { arrayToString } from '@ssttevee/u8-utils';

tape('readable', async function (t: tape.Test): Promise<void> {
    t.test('iterators', async function(t: tape.Test): Promise<void> {
        async function testSuite(t: tape.Test, needle: string, payload: string, expected: string[]): Promise<void> {
            t.deepEqual(
                await new ReadableStreamSearch(needle, makeStream([payload])).allStrings(),
                expected,
            );

            const iter = new ReadableStreamSearch(needle, makeStream([payload])).arrays();
            for (let i = 0; i < expected.length; i++) {
                const { done, value } = await iter.next();
                t.notOk(done);
                t.equal(arrayToString(value), expected[i]);
            }
        
            const { done, value } = await iter.next();
            t.ok(done);
            t.notOk(value);
        }
    
        await testSuite(t, 'z', '12345z67890', ['12345', '67890']);
        await testSuite(t, 'ab', '12a45678a', ['12a45678a']);
    
        t.end();
    });
});
