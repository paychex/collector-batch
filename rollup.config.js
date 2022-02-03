const path = require('path');

const { nodeResolve } = require("@rollup/plugin-node-resolve");
const { terser } = require("rollup-plugin-terser");
const polyfills = require('rollup-plugin-node-polyfills');
const commonjs = require('@rollup/plugin-commonjs');
const { babel } = require("@rollup/plugin-babel");
const typescript = require('@rollup/plugin-typescript');

const pkg = require('./package.json');
const external = ['lodash', '@paychex/core'];
const output = {
    format: "umd",
    name: pkg.name,
    esModule: false,
    exports: "named",
    sourcemap: true,
    banner: `/*! ${pkg.name} v${pkg.version} */`,
    globals: {
        'lodash': '_',
        '@paychex/core': '@paychex/core',
    },
};

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
        input: 'index.ts',
        context: 'globalThis',
        plugins: [
            nodeResolve({
                browser: true,
                preferBuiltins: false,
            }),
            commonjs({
                include: /node_modules/,
            }),
            typescript({
                tsconfig: './tsconfig.json',
            }),
            babel({
                babelHelpers: "bundled",
            }),
            polyfills(),
        ],
        output: [{
            ...output,
            plugins: [terser()],
            file: pkg.browser.replace('.js', '.min.js'),
        }, {
            ...output,
            file: pkg.browser,
        }],
    },
    // ESM
    {
        context: 'globalThis',
        treeshake: false,
        input: 'index.ts',
        external,
        plugins: [
            typescript({
                tsconfig: './tsconfig.json',
            }),
            nodeResolve(),
            commonjs({
                include: /node_modules/,
            })
        ],
        output: {
            file: pkg.module,
            format: "esm",
            exports: "named",
            sourcemap: true,
            banner: `/*! ${pkg.name} v${pkg.version} */`,
        },
    },
    // CJS
    {
        context: 'globalThis',
        treeshake: false,
        input: 'index.ts',
        external,
        plugins: [
            typescript({
                tsconfig: './tsconfig.json',
            }),
            nodeResolve(),
            commonjs({
                include: /node_modules/,
            })
        ],
        output: {
            file: pkg.main,
            format: "cjs",
            exports: "named",
            sourcemap: true,
            banner: `/*! ${pkg.name} v${pkg.version} */`,
        },
    },
];