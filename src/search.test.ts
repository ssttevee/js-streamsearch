import { arrayToString, stringToArray } from '@ssttevee/u8-utils';
import t from 'tap';

import { StreamSearch, MATCH } from './search';

type Test = typeof t.Test.prototype;

function test(t: Test, needle: string, chunks: string[], expected: string[], lookbehind: string): void {
    const search = new StreamSearch(needle);

    const outchunks: Uint8Array[][] = [[]];
    for (const chunk of chunks) {
        for (const token of search.feed(stringToArray(chunk))) {
            if (token === MATCH) {
                outchunks.push([]);
            } else {
                outchunks[outchunks.length-1].push(token);
            }
        }
    }

    const end = search.end();
    outchunks[outchunks.length-1].push(end);

    t.deepEqual(outchunks.map((chunks) => chunks.map(arrayToString).join('')), expected);
    t.equal(arrayToString(end), lookbehind);
}

function suite(t: Test, name: string, split: (s: string) => string[]): void {
    t.test(name, function (t: Test): void {
        t.test('1 character needle', function (t: Test): void {
            t.test('should return the original payload if the needle cannot be found', function (t: Test) {
                test(t, '0', split('123456789'), ['123456789'], '');
                test(t, 'x', split('hello world'), ['hello world'], '');

                t.end();
            });

            t.test('should return the payload split by the needle', function (t: Test): void {
                test(t, '1', split('1234567891'), ['', '23456789', ''], '');
                test(t, '2', split('1234567892'), ['1', '3456789', ''], '');
                test(t, '8', split('1234567898'), ['1234567', '9', ''], '');
                test(t, '9', split('1234567899'), ['12345678', '', ''], '');

                t.end();
            });
            
            t.end();
        });

        t.test('2 (different) character needle', function (t: Test): void {
            t.test('should return the original payload if the needle cannot be found', function (t: Test): void {
                test(t, 'ab', split('123456789'), ['123456789'], '');
                test(t, 'ab', split('a23456789'), ['a23456789'], '');
                test(t, 'ab', split('1a3456789'), ['1a3456789'], '');
                test(t, 'ab', split('1b3456789'), ['1b3456789'], '');
                test(t, 'ab', split('123b56789'), ['123b56789'], '');
                test(t, 'ab', split('12a456789'), ['12a456789'], '');
                test(t, 'ab', split('12a45678a'), ['12a45678a'], 'a');
                test(t, 'ab', split('12a45678aa'), ['12a45678aa'], 'a');
                test(t, 'ab', split('12a45678x'), ['12a45678x'], '');
                test(t, 'ab', split('12a45678b'), ['12a45678b'], '');

                t.end();
            });

            t.test('should return the payload split by the needle', function (t: Test): void {
                test(t, 'ab', split('ab3456789ab'), ['', '3456789', ''], '');
                test(t, 'ab', split('1ab456789ab'), ['1', '456789', ''], '');
                test(t, 'ab', split('12ab56789ab'), ['12', '56789', ''], '');
                test(t, 'ab', split('123ab6789ab'), ['123', '6789', ''], '');

                test(t, 'ab', split('bbab3456789ab'), ['bb', '3456789', ''], '');
                test(t, 'ab', split('bb1ab456789ab'), ['bb1', '456789', ''], '');
                test(t, 'ab', split('bb12ab56789ab'), ['bb12', '56789', ''], '');
                test(t, 'ab', split('bb123ab6789ab'), ['bb123', '6789', ''], '');

                test(t, 'ab', split('baab3456789ab'), ['ba', '3456789', ''], '');
                test(t, 'ab', split('ba1ab456789ab'), ['ba1', '456789', ''], '');
                test(t, 'ab', split('ba12ab56789ab'), ['ba12', '56789', ''], '');
                test(t, 'ab', split('ba123ab6789ab'), ['ba123', '6789', ''], '');

                test(t, 'ab', split('003456789ab'), ['003456789', ''], '');
                test(t, 'ab', split('100456789aabab'), ['100456789a', '', ''], '');
                test(t, 'ab', split('120056789abbab'), ['120056789', 'b', ''], '');

                t.end();
            });
            
            t.end();
        });

        t.test('2 (identical) character needle', function (t: Test): void {
            t.test('should return the original payload if the needle cannot be found', function (t: Test): void {
                test(t, 'aa', split('123456789'), ['123456789'], '');
                test(t, 'aa', split('a23456789'), ['a23456789'], '');
                test(t, 'aa', split('1a3456789'), ['1a3456789'], '');
                test(t, 'aa', split('12a4a6789'), ['12a4a6789'], '');
                test(t, 'aa', split('12a45678a'), ['12a45678a'], 'a');
                test(t, 'aa', split('12a4a678ba'), ['12a4a678ba'], 'a');

                t.end();
            });

            t.test('should return the payload split by the needle', function (t: Test): void {
                test(t, '\n\n', split('\n\nhello world\n\n'), ['', 'hello world', ''], '');
                test(t, '\n\n', split('h\n\nello world'), ['h', 'ello world'], '');
                test(t, '\n\n', split('he\n\nllo world'), ['he', 'llo world'], '');
                test(t, '\n\n', split('hel\n\nlo world'), ['hel', 'lo world'], '');
                test(t, '\n\n', split('hello\n\nworld\n\n'), ['hello', 'world', ''], '');
                test(t, '\n\n', split('\nhello\n\nworld\n\n'), ['\nhello', 'world', ''], '');
                test(t, '\n\n', split('h\nello\n\nworld\n\n'), ['h\nello', 'world', ''], '');

                t.end();
            });
            
            t.end();
        });

        t.test('empty payload', function (t: Test): void {
            t.test('should return nothing', function (t: Test): void {
                test(t, '1', split(''), [''], '');
                test(t, 'abc', split(''), [''], '');
                test(t, 'hello world', split(''), [''], '');
                
                t.end();
            });
            
            t.end();
        });

        t.test('needles larger than the payload', function (t: Test): void {
            t.test('should return the original payload', function (t: Test): void {
                test(t, 'ab', split('a'), ['a'], 'a');
                test(t, 'hello', split('hm'), ['hm'], '');
                test(t, 'hello my world!', split('this is small'), ['this is small'], '');
                
                t.end();
            });
            
            t.end();
        });

        t.test('misc', function (t: Test): void {
            t.test('should work', function (t: Test): void {
                test(t, 'hello', split('hello world'), ['', ' world'], '');
                test(t, 'hello', split('helo world'), ['helo world'], '');
                test(t, 'hello world!', split('oh my, hello world'), ['oh my, hello world'], 'hello world');
                test(t, 'hello world!', split('oh my, hello world!! again, hello world!!'), ['oh my, ', '! again, ', '!'], '');
                test(t, 'abcb', split('ababcb'), ['ab', ''], '');
                test(t, '\r\n--boundary\r\n', split('some binary data\r\n--boundary\rnot really\r\nmore binary data\r\n--boundary\r\n'), ['some binary data\r\n--boundary\rnot really\r\nmore binary data', ''], '');
                test(t, 'I have control\n', split('[sbmh] inconclusive\nHorspoolTest: .........\nI hive control\nI have control\nx'), ['[sbmh] inconclusive\nHorspoolTest: .........\nI hive control\n', 'x'], '');
                test(t, 'aabcde', split('wehrjkaaabcdegrea'), ['wehrjka', 'grea'], 'a');
                test(t, 'aab', split('xwehrjkaaabcdegrea'), ['xwehrjka', 'cdegrea'], 'a');
                
                t.end();
            });
            
            t.end();
        });

        t.end();
    });
}

t.test('constructor', function (t: Test): void {
    const token = 'hello';

    t.test('should work with string', function (t: Test): void {
        t.doesNotThrow(() => new StreamSearch(token));

        t.end();
    });

    t.test('should work with Uint8Array', function (t: Test): void {
        t.doesNotThrow(() => new StreamSearch(stringToArray(token)));

        t.end();
    });

    t.end();
});

suite(t, 'feeding all data in one pass', (s: string) => [s]);
suite(t, 'feeding data byte by byte', (s: string) => s.split(''));
suite(t, 'feeding data in chunks of 3 bytes', (s: string) => Array.from({ length: Math.ceil(s.length / 3) }, (_, i) => s.substr(i * 3, 3)));
