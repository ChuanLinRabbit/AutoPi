import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import { terser } from 'rollup-plugin-terser';
import cleanup from 'rollup-plugin-cleanup';
import nodePolyfills from 'rollup-plugin-polyfill-node'
import typescript from "@rollup/plugin-typescript";

export default [
    {
        input: './src/index.js',
        output: [{
            dir: 'dist',
            format: 'cjs',
            entryFileNames: 'AutoPi.cjs.js',
        },{
            dir: 'dist',
            format: 'esm',
            entryFileNames: 'AutoPi.esm.js',
        },{
            dir: 'dist',
            format: 'umd',
            entryFileNames: 'AutoPi.js',
            name: 'AutoPi'
        }],
        // plugins: [resolve(), commonjs(), typescript(), terser(), cleanup()],
        plugins: [resolve(), commonjs(), terser(), cleanup(), nodePolyfills()],
    },
];