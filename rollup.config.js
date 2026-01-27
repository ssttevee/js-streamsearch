import typescript from '@rollup/plugin-typescript';

export default {
    input: 'src/index.ts',
    external: [
        'uint8arrays/concat',
        'uint8arrays/to-string',
        'uint8arrays/from-string',
    ],
    output: [
        {
            file: 'lib/index.mjs',
            sourcemap: true,
            format: 'esm',
        },
        {
            file: 'lib/index.js',
            sourcemap: true,
            format: 'cjs',
        },
    ],
    plugins: [
        typescript(),
    ],
};
