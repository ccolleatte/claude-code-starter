import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import { existsSync, readFileSync } from 'fs-extra';
import { execSync } from 'child_process';
import * as path from 'path';
import * as os from 'os';

import { CleanOptions } from '../types';

interface CleanableItem {
  name: string;
  path: string;
  description: string;
  type: 'cache' | 'artifacts' | 'logs' | 'temp';
  size?: number;
  dangerous?: boolean;
}

export async function cleanCommand(options: CleanOptions): Promise<void> {
  console.log(chalk.blue.bold('🧹 Claude Stack Cleaner'));
  console.log();

  try {
    const cleanableItems = await discoverCleanableItems();

    if (cleanableItems.length === 0) {
      console.log(chalk.green('✅ Nothing to clean - project is already tidy!'));
      return;
    }

    // Filtrer selon les options
    let itemsToClean = cleanableItems;
    if (options.cache) {
      itemsToClean = cleanableItems.filter(item => item.type === 'cache');
    } else if (options.artifacts) {
      itemsToClean = cleanableItems.filter(item => item.type === 'artifacts');
    } else if (options.all) {
      itemsToClean = cleanableItems;
    } else {
      // Mode interactif
      itemsToClean = await selectItemsToClean(cleanableItems);
    }

    if (itemsToClean.length === 0) {
      console.log(chalk.yellow('No items selected for cleaning'));
      return;
    }

    // Afficher ce qui va être nettoyé
    displayCleaningSummary(itemsToClean);

    // Demander confirmation pour les éléments dangereux
    const dangerousItems = itemsToClean.filter(item => item.dangerous);
    if (dangerousItems.length > 0) {
      const { confirmDangerous } = await inquirer.prompt([{
        type: 'confirm',
        name: 'confirmDangerous',
        message: `${dangerousItems.length} potentially dangerous items selected. Continue?`,
        default: false
      }]);

      if (!confirmDangerous) {
        itemsToClean = itemsToClean.filter(item => !item.dangerous);
        console.log(chalk.yellow('Skipping dangerous items'));
      }
    }

    if (itemsToClean.length === 0) {
      console.log(chalk.yellow('No safe items to clean'));
      return;
    }

    // Effectuer le nettoyage
    await performCleaning(itemsToClean);

    console.log();
    console.log(chalk.green.bold('✅ Cleaning completed successfully!'));

  } catch (error) {
    console.error(chalk.red('Cleaning failed:'), error.message);
    process.exit(1);
  }
}

async function discoverCleanableItems(): Promise<CleanableItem[]> {
  const items: CleanableItem[] = [];

  // Cache NPM
  if (existsSync('node_modules')) {
    const size = await getDirectorySize('node_modules');
    items.push({
      name: 'NPM Dependencies',
      path: 'node_modules',
      description: 'Node.js dependencies (will require npm install to restore)',
      type: 'cache',
      size,
      dangerous: true
    });
  }

  // Cache NPM global
  try {
    const npmCacheDir = execSync('npm config get cache', { encoding: 'utf8' }).trim();
    if (existsSync(npmCacheDir)) {
      const size = await getDirectorySize(npmCacheDir);
      items.push({
        name: 'NPM Cache',
        path: npmCacheDir,
        description: 'NPM download cache',
        type: 'cache',
        size
      });
    }
  } catch (error) {
    // Ignorer si on ne peut pas obtenir le cache NPM
  }

  // Artifacts de build
  const buildDirs = ['dist', 'build', 'out', '.next', '.nuxt'];
  buildDirs.forEach(dir => {
    if (existsSync(dir)) {
      items.push({
        name: `Build Artifacts (${dir})`,
        path: dir,
        description: `Built application files in ${dir}`,
        type: 'artifacts'
      });
    }
  });

  // Coverage reports
  if (existsSync('coverage')) {
    items.push({
      name: 'Coverage Reports',
      path: 'coverage',
      description: 'Test coverage reports',
      type: 'artifacts'
    });
  }

  // Logs
  const logPatterns = ['*.log', 'logs/', '.logs/', 'log/'];
  for (const pattern of logPatterns) {
    if (pattern.endsWith('/')) {
      if (existsSync(pattern)) {
        items.push({
          name: `Log Directory (${pattern})`,
          path: pattern,
          description: 'Application log files',
          type: 'logs'
        });
      }
    } else {
      // Chercher les fichiers de log
      try {
        const files = require('glob').sync(pattern);
        files.forEach((file: string) => {
          items.push({
            name: `Log File (${file})`,
            path: file,
            description: 'Application log file',
            type: 'logs'
          });
        });
      } catch (error) {
        // Ignorer si glob n'est pas disponible
      }
    }
  }

  // Fichiers temporaires
  const tempPatterns = ['.tmp/', 'tmp/', '.temp/', 'temp/'];
  tempPatterns.forEach(pattern => {
    if (existsSync(pattern)) {
      items.push({
        name: `Temporary Directory (${pattern})`,
        path: pattern,
        description: 'Temporary files',
        type: 'temp'
      });
    }
  });

  // Cache TypeScript
  if (existsSync('.tsbuildinfo')) {
    items.push({
      name: 'TypeScript Build Info',
      path: '.tsbuildinfo',
      description: 'TypeScript incremental build cache',
      type: 'cache'
    });
  }

  // Cache ESLint
  if (existsSync('.eslintcache')) {
    items.push({
      name: 'ESLint Cache',
      path: '.eslintcache',
      description: 'ESLint linting cache',
      type: 'cache'
    });
  }

  // Cache Prettier
  const prettierCache = path.join(os.tmpdir(), '.prettiercache');
  if (existsSync(prettierCache)) {
    items.push({
      name: 'Prettier Cache',
      path: prettierCache,
      description: 'Prettier formatting cache',
      type: 'cache'
    });
  }

  // Cache Jest
  const jestCache = path.join(os.tmpdir(), 'jest_*');
  try {
    const jestDirs = require('glob').sync(jestCache);
    jestDirs.forEach((dir: string) => {
      items.push({
        name: `Jest Cache (${path.basename(dir)})`,
        path: dir,
        description: 'Jest testing cache',
        type: 'cache'
      });
    });
  } catch (error) {
    // Ignorer si glob n'est pas disponible
  }

  // Backups Claude Stack
  try {
    const backupFiles = require('glob').sync('.claude-stack.yml.backup*');
    backupFiles.forEach((file: string) => {
      items.push({
        name: `Backup (${file})`,
        path: file,
        description: 'Claude Stack configuration backup',
        type: 'temp'
      });
    });
  } catch (error) {
    // Ignorer si glob n'est pas disponible
  }

  // Cache du système (OS spécifique)
  if (os.platform() === 'darwin') {
    // macOS .DS_Store files
    try {
      const dsStoreFiles = require('glob').sync('**/.DS_Store', { dot: true });
      dsStoreFiles.forEach((file: string) => {
        items.push({
          name: `.DS_Store (${file})`,
          path: file,
          description: 'macOS folder metadata',
          type: 'temp'
        });
      });
    } catch (error) {
      // Ignorer si glob n'est pas disponible
    }
  }

  // Thumbs.db sur Windows
  if (os.platform() === 'win32') {
    try {
      const thumbsFiles = require('glob').sync('**/Thumbs.db', { dot: true });
      thumbsFiles.forEach((file: string) => {
        items.push({
          name: `Thumbs.db (${file})`,
          path: file,
          description: 'Windows thumbnail cache',
          type: 'temp'
        });
      });
    } catch (error) {
      // Ignorer si glob n'est pas disponible
    }
  }

  return items;
}

async function selectItemsToClean(items: CleanableItem[]): Promise<CleanableItem[]> {
  console.log(chalk.white.bold('🗂️  Discovered cleanable items:'));
  console.log();

  items.forEach(item => {
    const typeIcon = getTypeIcon(item.type);
    const dangerousFlag = item.dangerous ? chalk.red(' [DANGEROUS]') : '';
    const sizeInfo = item.size ? ` (${formatSize(item.size)})` : '';

    console.log(`   ${typeIcon} ${chalk.white(item.name)}${sizeInfo}${dangerousFlag}`);
    console.log(`      ${chalk.gray(item.description)}`);
    console.log(`      ${chalk.gray('Path:')} ${item.path}`);
  });

  console.log();

  const choices = items.map(item => ({
    name: `${item.name}${item.size ? ` (${formatSize(item.size)})` : ''}${item.dangerous ? ' [DANGEROUS]' : ''}`,
    value: item,
    checked: !item.dangerous // Pre-select safe items
  }));

  const { selectedItems } = await inquirer.prompt([{
    type: 'checkbox',
    name: 'selectedItems',
    message: 'Select items to clean:',
    choices,
    validate: (selected: CleanableItem[]) => {
      if (selected.length === 0) {
        return 'Please select at least one item to clean';
      }
      return true;
    }
  }]);

  return selectedItems;
}

function displayCleaningSummary(items: CleanableItem[]): void {
  console.log(chalk.white.bold('🧹 Cleaning Summary:'));
  console.log();

  const byType = items.reduce((acc, item) => {
    if (!acc[item.type]) acc[item.type] = [];
    acc[item.type].push(item);
    return acc;
  }, {} as { [key: string]: CleanableItem[] });

  Object.entries(byType).forEach(([type, typeItems]) => {
    const typeIcon = getTypeIcon(type as any);
    console.log(`${typeIcon} ${chalk.white.bold(type.toUpperCase())} (${typeItems.length} items)`);

    typeItems.forEach(item => {
      const dangerousFlag = item.dangerous ? chalk.red(' [DANGEROUS]') : '';
      const sizeInfo = item.size ? ` (${formatSize(item.size)})` : '';
      console.log(`   • ${item.name}${sizeInfo}${dangerousFlag}`);
    });
  });

  const totalSize = items.reduce((sum, item) => sum + (item.size || 0), 0);
  if (totalSize > 0) {
    console.log();
    console.log(chalk.white.bold(`💾 Total size to free: ${formatSize(totalSize)}`));
  }

  console.log();
}

async function performCleaning(items: CleanableItem[]): Promise<void> {
  const spinner = ora('Cleaning items...').start();

  for (const item of items) {
    try {
      spinner.text = `Cleaning ${item.name}...`;

      if (existsSync(item.path)) {
        const stats = require('fs').statSync(item.path);

        if (stats.isDirectory()) {
          await removeDirectory(item.path);
        } else {
          require('fs').unlinkSync(item.path);
        }

        spinner.text = `✅ Cleaned ${item.name}`;
      }
    } catch (error) {
      spinner.text = `❌ Failed to clean ${item.name}: ${error.message}`;
      await new Promise(resolve => setTimeout(resolve, 1000)); // Pause to show the error
    }
  }

  spinner.succeed('Cleaning completed');
}

async function removeDirectory(dirPath: string): Promise<void> {
  const fs = require('fs');
  const path = require('path');

  if (!existsSync(dirPath)) return;

  const items = fs.readdirSync(dirPath);

  for (const item of items) {
    const itemPath = path.join(dirPath, item);
    const stats = fs.statSync(itemPath);

    if (stats.isDirectory()) {
      await removeDirectory(itemPath);
    } else {
      fs.unlinkSync(itemPath);
    }
  }

  fs.rmdirSync(dirPath);
}

async function getDirectorySize(dirPath: string): Promise<number> {
  if (!existsSync(dirPath)) return 0;

  try {
    // Utiliser du si disponible (Unix/macOS)
    if (os.platform() !== 'win32') {
      const output = execSync(`du -sb "${dirPath}" 2>/dev/null | cut -f1`, { encoding: 'utf8' });
      return parseInt(output.trim()) || 0;
    } else {
      // Fallback pour Windows
      return await getDirectorySizeRecursive(dirPath);
    }
  } catch (error) {
    return await getDirectorySizeRecursive(dirPath);
  }
}

async function getDirectorySizeRecursive(dirPath: string): Promise<number> {
  const fs = require('fs');
  const path = require('path');
  let totalSize = 0;

  try {
    const items = fs.readdirSync(dirPath);

    for (const item of items) {
      const itemPath = path.join(dirPath, item);
      const stats = fs.statSync(itemPath);

      if (stats.isDirectory()) {
        totalSize += await getDirectorySizeRecursive(itemPath);
      } else {
        totalSize += stats.size;
      }
    }
  } catch (error) {
    // Ignorer les erreurs d'accès
  }

  return totalSize;
}

function formatSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(1)} ${units[unitIndex]}`;
}

function getTypeIcon(type: string): string {
  switch (type) {
    case 'cache': return '💾';
    case 'artifacts': return '🏗️';
    case 'logs': return '📝';
    case 'temp': return '🗑️';
    default: return '📁';
  }
}