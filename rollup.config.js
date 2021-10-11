import babel from 'rollup-plugin-babel';
import commonjs from '@rollup/plugin-commonjs';
import nodeResolve from '@rollup/plugin-node-resolve';
import {uglify} from 'rollup-plugin-uglify';

import pkg from './package.json';

// 支持拓展文件
const extensions = ['.js', '.ts'];

// 相关配置plugins
const plugins = [
    nodeResolve({extensions}),
    commonjs(), // so Rollup can convert `ms` to an ES module
    babel({
        exclude: 'node_modules/**',
        runtimeHelpers: true,
        extensions
    }),
    // uglify()
];

export default [
    // browser-friendly UMD build
    {
        input: 'libs/main.ts',
        // external: ['zrender'],
        output: [{
            name: 'AILabel',
            file: pkg.browser,
            format: 'umd'
        }, {
            name: 'AILabel',
            file: pkg.browser_website,
            format: 'umd'
        }, {
            name: 'AILabel',
            file: pkg.browser_demo,
            format: 'umd'
        }],
        plugins
    },

    // CommonJS (for Node) and ES module (for bundlers) build.
    // (We could have three entries in the configuration array
    // instead of two, but it's quicker to generate multiple
    // builds from a single configuration where possible, using
    // an array for the `output` option, where we can specify
    // `file` and `format` for each target)
    // {
    //     input: 'libs/main.ts',
    //     external: ['lodash'],
    //     output: [
    //         { file: pkg.main, format: 'cjs' },
    //         { file: pkg.module, format: 'es' }
    //     ],
    //     plugins
    // }
];
