/* eslint-env node */

import babel from 'rollup-plugin-babel';
import {terser} from 'rollup-plugin-terser';

import pkg from './package.json';

/**
 * @external RollupConfig
 * @type {PlainObject}
 * @see {@link https://rollupjs.org/guide/en#big-list-of-options}
 */

/**
 * @param {PlainObject} config
 * @param {boolean} config.minifying
 * @param {string} [config.format='umd'} = {}]
 * @returns {external:RollupConfig}
 */
function getRollupObject ({minifying, format = 'umd'} = {}) {
  const nonMinified = {
    input: 'lib/duplex.js',
    output: {
      format,
      sourcemap: minifying,
      file: `dist/fast-json-patch${format !== 'umd' ? '-' + format : ''}${minifying ? '.min' : ''}.js`,
      name: 'jsonpatch',
      banner: '// fast-json-patch, version: ' + pkg.version
    },
    plugins: [
      babel()
    ]
  };
  if (minifying) {
    nonMinified.plugins.push(terser());
  }
  return nonMinified;
}

export default [
  getRollupObject({minifying: false, format: 'umd'}),
  getRollupObject({minifying: true, format: 'umd'}),
  getRollupObject({minifying: true, format: 'es'}),
  getRollupObject({minifying: false, format: 'es'})
];
