const path = require('path');

const { nodeResolve } = require("@rollup/plugin-node-resolve");
const { terser } = require("rollup-plugin-terser");
const polyfills = require('rollup-plugin-node-polyfills');
const commonjs = require('@rollup/plugin-commonjs');
const { babel } = require("@rollup/plugin-babel");

const pkg = require('./package.json');
const external = ['lodash-es', '@paychex/core'];

const output = {
    format: "umd",
    name: pkg.name,
    esModule: false,
    exports: "named",
    sourcemap: true,
    sourcemapPathTransform: (relativeSourcePath, sourcemapPath) => {
        return `${pkg.name}/${path.relative(path.resolve('.'), path.resolve(path.dirname(sourcemapPath), relativeSourcePath))}`;
    },
    globals: {
        'lodash-es': '_',
        '@paychex/core': '@paychex/core',
    },
    paths: {
        'lodash-es': 'lodash',
        '@paychex/core': '@paychex/core',
    }
};

module.exports = [
    {
        // UMD
        external,
        input: 'index.mjs',
        context: 'window',
        plugins: [
            nodeResolve({
                browser: true,
                preferBuiltins: false,
            }),
            commonjs({
                include: /node_modules/,
            }),
            babel({
                babelHelpers: "bundled",
            }),
            polyfills(),
        ],
        output: [{
            ...output,
            plugins: [terser()],
            file: `dist/paychex.collector-batch.min.js`,
        }, {
            ...output,
            file: `dist/paychex.collector-batch.js`,
        }],
    },
    // ESM
    {
        context: 'globalThis',
        treeshake: false,
        input: 'index.mjs',
        external,
        plugins: [
            nodeResolve(),
            commonjs({
                include: /node_modules/,
            })
        ],
        output: {
            dir: "dist/esm",
            format: "esm",
            exports: "named",
            sourcemap: true,
        },
    },
    // CJS
    {
        context: 'globalThis',
        treeshake: false,
        input: 'index.mjs',
        external,
        plugins: [
            nodeResolve(),
            commonjs({
                include: /node_modules/,
            })
        ],
        output: {
            dir: "dist/cjs",
            format: "cjs",
            exports: "named",
            sourcemap: true,
            paths: {
                'lodash-es': 'lodash'
            }
        },
    },
];