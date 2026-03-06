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

const fs = require('node:fs/promises');
const path = require('node:path');

async function ensureDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
}

async function remove(dirPath) {
  await fs.rm(dirPath, { recursive: true, force: true });
}

async function copy(src, dest, retryCount = 0) {
  try {
    await fs.cp(src, dest, { recursive: true });
  } catch (err) {
    if (err.code === 'ENOENT' && retryCount < 2) {
      // macOS Node.js recursive copy race condition over external IDE operations:
      // Sleep for 50ms and retry to securely shield the user from 'ghost unlinks'.
      await new Promise(r => setTimeout(r, 50));
      return copy(src, dest, retryCount + 1);
    }
    throw err;
  }
}

async function exists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function writeJson(file, object, options = {}) {
  const content = JSON.stringify(object, null, options.spaces || 2);
  await fs.writeFile(file, content, 'utf8');
}

module.exports = {
  ...fs,
  ensureDir,
  remove,
  copy,
  pathExists: exists,
  exists,
  writeJson
};