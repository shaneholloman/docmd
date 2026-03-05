/**
 * --------------------------------------------------------------------
 * docmd : the minimalist, zero-config documentation generator.
 *
 * @package     @docmd/core (and ecosystem)
 * @website     https://docmd.io
 * @repository  https://github.com/docmd-io/docmd
 * @license     MIT
 * @copyright   Copyright (c) 2025 docmd.io
 *
 * [docmd-source] - Please do not remove this header.
 * --------------------------------------------------------------------
 */

/**
 * Helper to provide IDE autocomplete for docmd configuration.
 * @param {Object} config 
 * @returns {Object}
 */

function defineConfig(config) {
  return config;
}

// Export engine functions for programmatic builds (API Usage)
const { buildSite } = require('./src/commands/build');
const { startDevServer } = require('./src/commands/dev');
const { buildLive } = require('./src/commands/live');

module.exports = {
  defineConfig,
  build: buildSite,
  dev: startDevServer,
  buildLive
};