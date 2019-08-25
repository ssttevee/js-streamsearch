import fs from 'fs';
import path from 'path';

import { StreamSearch } from '../src';
import { makeStream, cmp } from './util';
import { stringToArray } from '../src/util';

function allpos(haystack: string, needle: string): number[] {
    let start = 0;
    let allpos = [];
    while (true) {
        const pos = haystack.indexOf(needle, start);
        if (pos === -1) {
            return allpos;
        }

        allpos.push(pos);
        start += pos + needle.length;
        if (start > haystack.length) {
            return allpos;
        }
    }
}

function chars(str: string, start: number, len: number, cuts: number[]): any[] {
    const arr: any[] = Array.from(stringToArray(str.substr(start, len)));

    cuts = cuts.map((cut) => cut - start).filter((cut) => cut < len).reverse();
    for (const cut of cuts) {
        arr.splice(cut, 0, '|');
    }

    return arr;
}

const lookbehind = 10;
const lookfront = 5;
const lookback = 5;
const lookahead = 10;

function inspect(str: string, pos: number, len: number, cuts: number[]) {
    const start = pos - lookbehind;
    const end = pos + len + lookahead;
    cuts = cuts.filter((cut) => start < cut && cut < end);

    console.log(
        ...chars(str, start, lookbehind, cuts),
        '[',
        ...chars(str, pos, lookfront, cuts),
        '...',
        ...chars(str, pos + len - lookback, lookback, cuts),
        ']',
        ...chars(str, pos + len, lookahead, cuts),
    );
}

async function inspectInput(needle: string, chunks: string[]) {
    const cuts = chunks.slice(1).reduce((cuts: number[], value: string) => [...cuts, cuts[cuts.length - 1] + value.length], [chunks[0].length]);
    const haystack = chunks.join('');
    const expected = haystack.split(needle);

    const search = new StreamSearch(needle, makeStream(chunks));
    const result = await search.drainStrings();

    console.log('needle length:', needle.length);
    console.log('haystack length:', haystack.length);
    console.log('expected segments:', expected.length);
    console.log('actual segments:', result.length);

    if (expected.length !== result.length) {
        return;
    }

    const indices = [];
    for (let i = 0; i < expected.length; i++) {
        if (cmp(expected[i], result[i])) {
            continue;
        }

        indices.push(i);
    }

    if (indices.length === 0) {
        console.log('false positive');
        return;
    }

    console.log('mismatched indices:', ...indices);

    console.log();
    console.log('needle head', ...stringToArray(needle.slice(0, 10)));
    console.log('needle tail', ...stringToArray(needle.slice(-10)));

    for (const index of indices) {
        console.log();

        if (result[index].length !== expected[index].length) {
            console.log('expected and actual values have different lengths:', expected[index].length, result[index].length);
        }

        for (let i = 0; i < Math.max(result[index].length, expected[index].length); i++) {
            const expectedCh = expected[index].charCodeAt(i);
            const actualCh = result[index].charCodeAt(i);
            if (actualCh !== expectedCh) {
                console.log(i, expectedCh, actualCh);
            }
        }

        const actualPos = allpos(haystack, result[index]);
        const expectedPos = allpos(haystack, expected[index]);
        if (actualPos.length !== expectedPos.length) {
            console.log('hmmm...');
            return;
        }

        for (let i = 0; i < expectedPos.length; i++) {
            console.log();

            const pos = expectedPos[i];
            inspect(haystack, pos, result[index].length, cuts);
            inspect(haystack, pos, expected[index].length, cuts);
        }
    }
}

(async function () {
    const dir = 'erroneous_input';
    for(const file of fs.readdirSync(dir)) {
        const { needle, chunks } = JSON.parse(fs.readFileSync(path.join(dir, file)).toString());
        await inspectInput(needle, chunks);
    }
})().catch(console.error);
