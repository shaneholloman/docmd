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

import fs from '../utils/fs-utils.js';
import path from 'path';
import chalk from 'chalk';
import nativeFs from 'fs';

function serializeConfig(obj: any) {
  const json = JSON.stringify(obj, null, 2);
  const cleanJs = json.replace(/"([^"]+)":/g, '$1:');
  return `export default ${cleanJs};\n`;
}

export async function migrateProject(options: { docusaurus?: boolean; mkdocs?: boolean; vitepress?: boolean; starlight?: boolean }) {
  const CWD = process.cwd();

  const moveFilesToBackup = async (backupDir: string) => {
    const backupName = path.basename(backupDir);
    const files = await nativeFs.promises.readdir(CWD);
    for (const file of files) {
      if (file === 'node_modules' || file === '.git' || file === backupName || file === 'docmd.config.js') {
        continue;
      }
      const oldPath = path.resolve(CWD, file);
      const newPath = path.resolve(backupDir, file);
      await nativeFs.promises.rename(oldPath, newPath);
    }
  };

  if (options.docusaurus) {
    console.log(chalk.blue('📦 Migrating from Docusaurus...'));
    const configPath = path.resolve(CWD, 'docusaurus.config.js');
    const tsConfigPath = path.resolve(CWD, 'docusaurus.config.ts');

    let activeConfigPath = '';
    if (nativeFs.existsSync(configPath)) activeConfigPath = configPath;
    else if (nativeFs.existsSync(tsConfigPath)) activeConfigPath = tsConfigPath;
    else {
      console.error(chalk.red('❌ docusaurus.config.js or docusaurus.config.ts not found in the current directory.'));
      return;
    }

    const backupDir = path.resolve(CWD, 'docusaurus-backup');
    await fs.ensureDir(backupDir);

    const rawConfig = await nativeFs.promises.readFile(activeConfigPath, 'utf8');
    let title = 'Docmd Site';
    const titleMatch = rawConfig.match(/title:\s*['"]([^'"]+)['"]/);
    if (titleMatch) title = titleMatch[1];

    await moveFilesToBackup(backupDir);

    const backupDocsDir = path.resolve(backupDir, 'docs');
    const newDocsDir = path.resolve(CWD, 'docs');
    if (nativeFs.existsSync(backupDocsDir)) {
      await fs.copy(backupDocsDir, newDocsDir);
      console.log(chalk.dim(`   > Copied docs/ directory`));
    } else {
      await fs.ensureDir(newDocsDir);
    }

    const docmdConfig = { title, src: 'docs', out: 'dist', theme: { appearance: 'system' } };
    await nativeFs.promises.writeFile(path.resolve(CWD, 'docmd.config.js'), serializeConfig(docmdConfig));

    console.log(chalk.green('\n✅ Docusaurus Migration Complete!'));
    console.log(`   Original files moved to: ${chalk.cyan('docusaurus-backup/')}`);
    console.log(`   Run ${chalk.cyan('npx @docmd/core dev')} to preview your site.`);

  } else if (options.mkdocs) {
    console.log(chalk.blue('📦 Migrating from MkDocs...'));
    const configPath = path.resolve(CWD, 'mkdocs.yml');

    if (!nativeFs.existsSync(configPath)) {
      console.error(chalk.red('❌ mkdocs.yml not found in the current directory.'));
      return;
    }

    const backupDir = path.resolve(CWD, 'mkdocs-backup');
    await fs.ensureDir(backupDir);

    const rawConfig = await nativeFs.promises.readFile(configPath, 'utf8');
    let title = 'Docmd Site';
    const titleMatch = rawConfig.match(/^site_name:\s*['"]?([^'"\n]+)['"]?/m);
    if (titleMatch) title = titleMatch[1].trim();

    await moveFilesToBackup(backupDir);

    const backupDocsDir = path.resolve(backupDir, 'docs');
    const newDocsDir = path.resolve(CWD, 'docs');
    if (nativeFs.existsSync(backupDocsDir)) {
      await fs.copy(backupDocsDir, newDocsDir);
      console.log(chalk.dim(`   > Copied docs/ directory`));
    } else {
      await fs.ensureDir(newDocsDir);
    }

    const docmdConfig = { title, src: 'docs', out: 'dist', theme: { appearance: 'system' } };
    await nativeFs.promises.writeFile(path.resolve(CWD, 'docmd.config.js'), serializeConfig(docmdConfig));

    console.log(chalk.green('\n✅ MkDocs Migration Complete!'));
    console.log(`   Original files moved to: ${chalk.cyan('mkdocs-backup/')}`);
    console.log(`   Run ${chalk.cyan('npx @docmd/core dev')} to preview your site.`);

  } else if (options.vitepress) {
    console.log(chalk.blue('📦 Migrating from VitePress...'));
    const CWD = process.cwd();

    let configDir = '';
    let activeConfigPath = '';

    // Check if config is in root or docs
    for (const dir of ['.vitepress', 'docs/.vitepress']) {
      for (const ext of ['js', 'ts', 'mjs']) {
        const p = path.resolve(CWD, `${dir}/config.${ext}`);
        if (nativeFs.existsSync(p)) {
          configDir = dir;
          activeConfigPath = p;
          break;
        }
      }
      if (activeConfigPath) break;
    }

    if (!activeConfigPath) {
      console.error(chalk.red('❌ .vitepress/config.[js|ts|mjs] not found in root or docs/ directory.'));
      return;
    }

    const backupDir = path.resolve(CWD, 'vitepress-backup');
    await fs.ensureDir(backupDir);

    const rawConfig = await nativeFs.promises.readFile(activeConfigPath, 'utf8');
    let title = 'Docmd Site';
    const titleMatch = rawConfig.match(/title:\s*['"]([^'"]+)['"]/);
    if (titleMatch) title = titleMatch[1];

    await moveFilesToBackup(backupDir);

    // Determine the source of docs. If config is in docs/.vitepress, docs is in docs/. Otherwise docs is in root.
    const isDocsInRoot = configDir === '.vitepress';
    const newDocsDir = path.resolve(CWD, 'docs');
    await fs.ensureDir(newDocsDir);

    if (isDocsInRoot) {
      // Copy all .md files from backup root to new docs dir
      const files = await nativeFs.promises.readdir(backupDir);
      for (const file of files) {
        if (file.endsWith('.md')) {
          await fs.copy(path.resolve(backupDir, file), path.resolve(newDocsDir, file));
        }
      }
      console.log(chalk.dim(`   > Copied root markdown files to docs/`));
    } else {
      // Config was in docs/.vitepress, copy the docs folder except .vitepress
      const backupDocsDir = path.resolve(backupDir, 'docs');
      if (nativeFs.existsSync(backupDocsDir)) {
        await fs.copy(backupDocsDir, newDocsDir);
        await fs.remove(path.resolve(newDocsDir, '.vitepress'));
        console.log(chalk.dim(`   > Copied docs/ directory (stripped .vitepress)`));
      }
    }

    const docmdConfig = { title, src: 'docs', out: 'dist', theme: { appearance: 'system' } };
    await nativeFs.promises.writeFile(path.resolve(CWD, 'docmd.config.js'), serializeConfig(docmdConfig));

    console.log(chalk.green('\n✅ VitePress Migration Complete!'));
    console.log(`   Original files moved to: ${chalk.cyan('vitepress-backup/')}`);
    console.log(`   Run ${chalk.cyan('npx @docmd/core dev')} to preview your site.`);

  } else if (options.starlight) {
    console.log(chalk.blue('📦 Migrating from Astro Starlight...'));
    const configPath = path.resolve(CWD, 'astro.config.mjs');
    const tsConfigPath = path.resolve(CWD, 'astro.config.ts');

    let activeConfigPath = '';
    if (nativeFs.existsSync(configPath)) activeConfigPath = configPath;
    else if (nativeFs.existsSync(tsConfigPath)) activeConfigPath = tsConfigPath;
    else {
      console.error(chalk.red('❌ astro.config.mjs or astro.config.ts not found.'));
      return;
    }

    const backupDir = path.resolve(CWD, 'starlight-backup');
    await fs.ensureDir(backupDir);

    const rawConfig = await nativeFs.promises.readFile(activeConfigPath, 'utf8');
    let title = 'Docmd Site';
    const titleMatch = rawConfig.match(/title:\s*['"]([^'"]+)['"]/);
    if (titleMatch) title = titleMatch[1];

    await moveFilesToBackup(backupDir);

    const backupDocsDir = path.resolve(backupDir, 'src/content/docs');
    const newDocsDir = path.resolve(CWD, 'docs');

    if (nativeFs.existsSync(backupDocsDir)) {
      await fs.copy(backupDocsDir, newDocsDir);
      console.log(chalk.dim(`   > Copied src/content/docs/ to docs/`));
    } else {
      await fs.ensureDir(newDocsDir);
    }

    const docmdConfig = { title, src: 'docs', out: 'dist', theme: { appearance: 'system' } };
    await nativeFs.promises.writeFile(path.resolve(CWD, 'docmd.config.js'), serializeConfig(docmdConfig));

    console.log(chalk.green('\n✅ Astro Starlight Migration Complete!'));
    console.log(`   Original files moved to: ${chalk.cyan('starlight-backup/')}`);
    console.log(`   Run ${chalk.cyan('npx @docmd/core dev')} to preview your site.`);
  }
}