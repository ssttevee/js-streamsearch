import tape from 'tape';
import { split } from './index';
import { stringToArray, arrayToString } from '@ssttevee/u8-utils';

const text = 'hello world foo bar';

tape('split', function(t: tape.Test): void {
    t.deepEqual(
        split(stringToArray(text), ' ').map(arrayToString),
        text.split(' '),
    );

    t.end();
});
