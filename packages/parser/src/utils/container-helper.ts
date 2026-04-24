/**
 * --------------------------------------------------------------------
 * docmd : the zero-config documentation engine.
 *
 * @package     @docmd/core (and ecosystem)
 * @website     https://docmd.io
 * @repository  https://github.com/docmd-io/docmd
 * @license     MIT
 * @copyright   Copyright (c) 2025-present docmd.io
 *
 * [docmd-source] - Please do not remove this header.
 * --------------------------------------------------------------------
 */

/**
 * Extracts a quoted title (e.g., "My Title") and an optional icon (e.g., icon:rocket) from a string.
 * This is the standard parser for docmd containers (callouts, cards, tabs, etc.)
 * 
 * @param {string} info - The raw info string to parse
 * @returns {{ title: string, icon: string }}
 */
export function parseTitleAndIcon(info) {
  if (!info) return { title: '', icon: '' };
  let icon = '';
  const iconMatch = info.match(/icon:([a-zA-Z0-9-]+)/);
  if (iconMatch) {
    icon = iconMatch[1];
    info = info.replace(iconMatch[0], '');
  }

  const titleMatch = info.match(/"([^"]*)"/);
  const title = titleMatch ? titleMatch[1] : info.trim();

  return { title, icon };
}