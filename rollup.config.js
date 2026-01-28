import typescript from '@rollup/plugin-typescript';

export default {
    input: [
        'src/index.ts',
        'src/iterate-chunks.ts',
        'src/iterate-chunks-concatted.ts',
        'src/iterate-strings.ts',
        'src/iterator.ts',
        'src/queueable.ts',
        'src/readable.ts',
        'src/search.ts',
        'src/split.ts',
    ],
    external: [
        'uint8arrays/concat',
        'uint8arrays/to-string',
        'uint8arrays/from-string',
    ],
    output: [
        {
            dir: 'lib',
            entryFileNames: '[name].mjs',
            sourcemap: true,
            format: 'esm',
        },
        {
            dir: 'lib',
            entryFileNames: '[name].cjs',
            sourcemap: true,
            format: 'cjs',
        },
    ],
    plugins: [
        typescript(),
    ],
};
