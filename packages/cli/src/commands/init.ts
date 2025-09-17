import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import { existsSync, writeFileSync, mkdirSync } from 'fs-extra';
import { join } from 'path';
import { execSync } from 'child_process';
import * as yaml from 'yaml';

import { InitOptions } from '../types';
import { getProfile, listProfiles } from '../profiles';
import { generateProjectStructure } from '../utils/generator';
import { validateProjectName } from '../utils/validation';

export async function initCommand(options: InitOptions): Promise<void> {
  const spinner = ora();

  try {
    console.log(chalk.blue.bold('🚀 Claude Stack CLI - Project Initialization'));
    console.log();

    // 1. Validation du répertoire
    if (existsSync('.claude-stack.yml') && !options.force) {
      console.log(chalk.yellow('⚠️  Claude Stack already initialized in this directory.'));
      console.log(chalk.gray('Use --force to reinitialize'));
      return;
    }

    // 2. Configuration interactive ou options
    const config = await gatherConfiguration(options);

    if (options.dryRun) {
      console.log(chalk.cyan('🔍 Dry run - Configuration that would be applied:'));
      console.log(chalk.gray(JSON.stringify(config, null, 2)));
      return;
    }

    // 3. Génération de la structure
    spinner.start('Generating project structure...');
    await generateProjectStructure(config);
    spinner.succeed('Project structure generated');

    // 4. Installation des dépendances
    spinner.start('Installing dependencies...');
    await installDependencies(config);
    spinner.succeed('Dependencies installed');

    // 5. Configuration Git hooks (si applicable)
    if (existsSync('.git')) {
      spinner.start('Setting up Git hooks...');
      await setupGitHooks(config);
      spinner.succeed('Git hooks configured');
    }

    // 6. Validation finale
    spinner.start('Validating configuration...');
    await validateSetup(config);
    spinner.succeed('Configuration validated');

    // 7. Résumé de succès
    console.log();
    console.log(chalk.green.bold('✅ Claude Stack initialized successfully!'));
    console.log();
    console.log(chalk.white('📋 Profile:'), chalk.cyan(config.profile.toUpperCase()));
    console.log(chalk.white('📁 Project:'), chalk.cyan(config.projectName));
    console.log();
    console.log(chalk.white('🔧 Next steps:'));
    console.log(chalk.gray('  1. Run tests:      '), chalk.cyan('npm test'));
    console.log(chalk.gray('  2. Run security:   '), chalk.cyan('claude-stack audit'));
    console.log(chalk.gray('  3. Check status:   '), chalk.cyan('claude-stack status'));
    console.log();

  } catch (error) {
    spinner.fail('Initialization failed');
    console.error(chalk.red('Error:'), error.message);
    process.exit(1);
  }
}

async function gatherConfiguration(options: InitOptions): Promise<any> {
  const profiles = listProfiles();

  // Configuration interactive si pas d'options
  if (!options.skipInteractive) {
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'projectName',
        message: 'Project name:',
        default: options.projectName || process.cwd().split('/').pop(),
        validate: (input: string) => validateProjectName(input)
      },
      {
        type: 'list',
        name: 'profile',
        message: 'Select a profile:',
        choices: profiles.map(p => ({
          name: `${p.name} - ${p.description}`,
          value: p.level
        })),
        default: options.profile || 'standard'
      },
      {
        type: 'confirm',
        name: 'setupCI',
        message: 'Setup GitHub Actions CI/CD?',
        default: true
      },
      {
        type: 'confirm',
        name: 'setupPreCommit',
        message: 'Setup pre-commit hooks?',
        default: true
      },
      {
        type: 'checkbox',
        name: 'additionalTools',
        message: 'Additional tools (optional):',
        choices: [
          { name: 'Docker configuration', value: 'docker' },
          { name: 'VS Code settings', value: 'vscode' },
          { name: 'DevContainer setup', value: 'devcontainer' },
          { name: 'Documentation templates', value: 'docs' }
        ]
      }
    ]);

    return {
      projectName: answers.projectName,
      profile: answers.profile,
      setupCI: answers.setupCI,
      setupPreCommit: answers.setupPreCommit,
      additionalTools: answers.additionalTools,
      profileConfig: getProfile(answers.profile)
    };
  }

  // Configuration depuis les options
  return {
    projectName: options.projectName || process.cwd().split('/').pop(),
    profile: options.profile || 'standard',
    setupCI: true,
    setupPreCommit: true,
    additionalTools: [],
    profileConfig: getProfile(options.profile || 'standard')
  };
}

async function installDependencies(config: any): Promise<void> {
  const { profileConfig } = config;

  // Collecter toutes les dépendances requises
  const dependencies = new Set<string>();
  const devDependencies = new Set<string>();

  Object.values(profileConfig.components).forEach((component: any) => {
    if (component.enabled) {
      component.tools.forEach((tool: string) => {
        // Mapping des outils vers les packages NPM
        const toolPackages = getToolPackages(tool);
        toolPackages.dependencies?.forEach(dep => dependencies.add(dep));
        toolPackages.devDependencies?.forEach(dep => devDependencies.add(dep));
      });
    }
  });

  // Installation via npm/yarn/pnpm (détecter le gestionnaire)
  const packageManager = detectPackageManager();

  if (dependencies.size > 0) {
    const depsArray = Array.from(dependencies);
    execSync(`${packageManager} add ${depsArray.join(' ')}`, { stdio: 'inherit' });
  }

  if (devDependencies.size > 0) {
    const devDepsArray = Array.from(devDependencies);
    const devFlag = packageManager === 'yarn' ? '--dev' : '--save-dev';
    execSync(`${packageManager} add ${devFlag} ${devDepsArray.join(' ')}`, { stdio: 'inherit' });
  }
}

function getToolPackages(tool: string): { dependencies?: string[], devDependencies?: string[] } {
  const packages: Record<string, any> = {
    jest: { devDependencies: ['jest', '@types/jest', 'jest-junit'] },
    pytest: { dependencies: ['pytest', 'pytest-cov', 'pytest-xdist'] },
    playwright: { devDependencies: ['@playwright/test'] },
    eslint: { devDependencies: ['eslint', '@typescript-eslint/eslint-plugin'] },
    prettier: { devDependencies: ['prettier'] },
    semgrep: { dependencies: ['semgrep'] },
    stryker: { devDependencies: ['@stryker-mutator/core', '@stryker-mutator/jest-runner'] }
  };

  return packages[tool] || {};
}

function detectPackageManager(): string {
  if (existsSync('yarn.lock')) return 'yarn';
  if (existsSync('pnpm-lock.yaml')) return 'pnpm';
  return 'npm';
}

async function setupGitHooks(config: any): Promise<void> {
  // Installation de husky pour les git hooks
  const packageManager = detectPackageManager();

  try {
    execSync(`${packageManager} add --save-dev husky`, { stdio: 'inherit' });
    execSync('npx husky install', { stdio: 'inherit' });

    // Pre-commit hook
    if (config.setupPreCommit) {
      execSync('npx husky add .husky/pre-commit "claude-stack audit --fix"', { stdio: 'inherit' });
    }

    // Pre-push hook
    execSync('npx husky add .husky/pre-push "npm test"', { stdio: 'inherit' });

  } catch (error) {
    console.warn(chalk.yellow('Warning: Could not setup Git hooks'), error.message);
  }
}

async function validateSetup(config: any): Promise<void> {
  // Vérifier que les fichiers essentiels ont été créés
  const requiredFiles = [
    '.claude-stack.yml',
    '.claude/mcp.json',
    'package.json'
  ];

  const missingFiles = requiredFiles.filter(file => !existsSync(file));

  if (missingFiles.length > 0) {
    throw new Error(`Missing required files: ${missingFiles.join(', ')}`);
  }

  // Vérifier que la configuration est valide
  try {
    const stackConfig = yaml.parse(require('fs').readFileSync('.claude-stack.yml', 'utf8'));
    if (!stackConfig.profile || !stackConfig.version) {
      throw new Error('Invalid .claude-stack.yml configuration');
    }
  } catch (error) {
    throw new Error(`Invalid configuration: ${error.message}`);
  }
}