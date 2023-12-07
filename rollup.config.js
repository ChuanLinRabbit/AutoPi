import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import { terser } from 'rollup-plugin-terser';
import cleanup from 'rollup-plugin-cleanup';
import nodePolyfills from 'rollup-plugin-polyfill-node'
import typescript from "@rollup/plugin-typescript";

export default [
    {
        input: './src/index.js',
        external: ['qs'],
        output: [{
            dir: 'core',
            format: 'cjs',
            entryFileNames: 'AutoPi.cjs.js',
        },{
            dir: 'core',
            format: 'esm',
            entryFileNames: 'AutoPi.esm.js',
        },{
            dir: 'core',
            format: 'umd',
            entryFileNames: 'AutoPi.js',
            name: 'AutoPi'
        }],
        // plugins: [resolve(), commonjs(), typescript(), terser(), cleanup()],
        plugins: [resolve(), commonjs(), terser(), cleanup(), nodePolyfills()],
    },
];