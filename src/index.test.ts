import { expect } from 'chai';
import { makeStream } from '../testing/util';
import { StreamSearch } from '.';
import { arrayToString, stringToArray } from '@ssttevee/u8-utils';

async function test(needle: string, payload: string[], expected: string[], lookbehind: string) {
    const search = new StreamSearch(needle, makeStream(payload));
    expect(await search.drainStrings()).to.deep.equal(expected);
    expect(arrayToString((search as any)._lookbehind)).to.equal(lookbehind);
}

function suite(split: (s: string) => string[]) {
    describe('1 character needle', function () {
        it('should return the original payload if the needle cannot be found', async function () {
            await test('0', split('123456789'), ['123456789'], '');
            await test('x', split('hello world'), ['hello world'], '');
        });

        it('should return the payload split by the needle', async function () {
            await test('1', split('1234567891'), ['', '23456789', ''], '');
            await test('2', split('1234567892'), ['1', '3456789', ''], '');
            await test('8', split('1234567898'), ['1234567', '9', ''], '');
            await test('9', split('1234567899'), ['12345678', '', ''], '');
        });
    });

    describe('2 (different) character needle', function () {
        it('should return the original payload if the needle cannot be found', async function () {
            await test('ab', split('123456789'), ['123456789'], '');
            await test('ab', split('a23456789'), ['a23456789'], '');
            await test('ab', split('1a3456789'), ['1a3456789'], '');
            await test('ab', split('1b3456789'), ['1b3456789'], '');
            await test('ab', split('123b56789'), ['123b56789'], '');
            await test('ab', split('12a456789'), ['12a456789'], '');
            await test('ab', split('12a45678a'), ['12a45678a'], 'a');
            await test('ab', split('12a45678aa'), ['12a45678aa'], 'a');
            await test('ab', split('12a45678x'), ['12a45678x'], '');
            await test('ab', split('12a45678b'), ['12a45678b'], '');
        });

        it('should return the payload split by the needle', async function () {
            await test('ab', split('ab3456789ab'), ['', '3456789', ''], '');
            await test('ab', split('1ab456789ab'), ['1', '456789', ''], '');
            await test('ab', split('12ab56789ab'), ['12', '56789', ''], '');
            await test('ab', split('123ab6789ab'), ['123', '6789', ''], '');

            await test('ab', split('bbab3456789ab'), ['bb', '3456789', ''], '');
            await test('ab', split('bb1ab456789ab'), ['bb1', '456789', ''], '');
            await test('ab', split('bb12ab56789ab'), ['bb12', '56789', ''], '');
            await test('ab', split('bb123ab6789ab'), ['bb123', '6789', ''], '');

            await test('ab', split('baab3456789ab'), ['ba', '3456789', ''], '');
            await test('ab', split('ba1ab456789ab'), ['ba1', '456789', ''], '');
            await test('ab', split('ba12ab56789ab'), ['ba12', '56789', ''], '');
            await test('ab', split('ba123ab6789ab'), ['ba123', '6789', ''], '');

            await test('ab', split('003456789ab'), ['003456789', ''], '');
            await test('ab', split('100456789aabab'), ['100456789a', '', ''], '');
            await test('ab', split('120056789abbab'), ['120056789', 'b', ''], '');
        });
    });

    describe('2 (identical) character needle', function () {
        it('should return the original payload if the needle cannot be found', async function () {
            await test('aa', split('123456789'), ['123456789'], '');
            await test('aa', split('a23456789'), ['a23456789'], '');
            await test('aa', split('1a3456789'), ['1a3456789'], '');
            await test('aa', split('12a4a6789'), ['12a4a6789'], '');
            await test('aa', split('12a45678a'), ['12a45678a'], 'a');
            await test('aa', split('12a4a678ba'), ['12a4a678ba'], 'a');
        });

        it('should return the payload split by the needle', async function () {
            await test('\n\n', split('\n\nhello world\n\n'), ['', 'hello world', ''], '');
            await test('\n\n', split('h\n\nello world'), ['h', 'ello world'], '');
            await test('\n\n', split('he\n\nllo world'), ['he', 'llo world'], '');
            await test('\n\n', split('hel\n\nlo world'), ['hel', 'lo world'], '');
            await test('\n\n', split('hello\n\nworld\n\n'), ['hello', 'world', ''], '');
            await test('\n\n', split('\nhello\n\nworld\n\n'), ['\nhello', 'world', ''], '');
            await test('\n\n', split('h\nello\n\nworld\n\n'), ['h\nello', 'world', ''], '');
        });
    });

    describe('empty payload', function () {
        it('should return nothing', async function () {
            await test('1', split(''), [''], '');
            await test('abc', split(''), [''], '');
            await test('hello world', split(''), [''], '');
        });
    });

    describe('needles larger than the payload', function () {
        it('should return the original payload', async function () {
            await test('ab', split('a'), ['a'], 'a');
            await test('hello', split('hm'), ['hm'], '');
            await test('hello my world!', split('this is small'), ['this is small'], '');
        });
    });

    describe('misc', function () {
        it('should work', async function () {
            await test('hello', split('hello world'), ['', ' world'], '');
            await test('hello', split('helo world'), ['helo world'], '');
            await test('hello world!', split('oh my, hello world'), ['oh my, hello world'], 'hello world');
            await test('hello world!', split('oh my, hello world!! again, hello world!!'), ['oh my, ', '! again, ', '!'], '');
            await test('abcb', split('ababcb'), ['ab', ''], '');
            await test('\r\n--boundary\r\n', split('some binary data\r\n--boundary\rnot really\r\nmore binary data\r\n--boundary\r\n'), ['some binary data\r\n--boundary\rnot really\r\nmore binary data', ''], '');
            await test('I have control\n', split('[sbmh] inconclusive\nHorspoolTest: .........\nI hive control\nI have control\nx'), ['[sbmh] inconclusive\nHorspoolTest: .........\nI hive control\n', 'x'], '');
            await test('aabcde', split('wehrjkaaabcdegrea'), ['wehrjka', 'grea'], 'a');
            await test('aab', split('xwehrjkaaabcdegrea'), ['xwehrjka', 'cdegrea'], 'a');
        });
    });
}

describe('StreamSearch', function () {
    describe('constructor', function () {
        const token = 'hello';
        const tokenArray = stringToArray(token);

        it('should work with string', function () {
            expect((new StreamSearch(token, null as any) as any)._needle).deep.equal(tokenArray);
        });

        it('should work with Uint8Array', function () {
            expect((new StreamSearch(tokenArray, null as any) as any)._needle).equal(tokenArray);
        });
    });

    describe('feeding all data in one pass', function () {
        suite((s: string) => [s]);
    });

    describe('feeding data byte by byte', function () {
        suite((s: string) => s.split(''));
    });

    describe('feeding data in chunks of 3 bytes', function () {
        suite((s: string) => Array.from({ length: Math.ceil(s.length / 3) }, (_, i) => s.substr(i * 3, 3)));
    });
});
