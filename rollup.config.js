import typescript from '@rollup/plugin-typescript';

export default {
    input: 'src/index.ts',
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
