import chalk from 'chalk';
import inquirer from 'inquirer';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs-extra';
import * as yaml from 'yaml';
import * as os from 'os';
import * as path from 'path';

import { ConfigOptions } from '../types';

interface ConfigValue {
  key: string;
  value: any;
  description: string;
  type: 'string' | 'boolean' | 'number' | 'array';
  scope: 'global' | 'project';
}

export async function configCommand(options: ConfigOptions): Promise<void> {
  const { action, key, value, global: isGlobal } = options;

  console.log(chalk.blue.bold('⚙️  Claude Stack Configuration'));
  console.log();

  try {
    switch (action) {
      case 'get':
        await handleGetConfig(key, isGlobal);
        break;
      case 'set':
        await handleSetConfig(key, value, isGlobal);
        break;
      case 'list':
        await handleListConfig(isGlobal);
        break;
      case 'reset':
        await handleResetConfig(key, isGlobal);
        break;
      case 'edit':
        await handleEditConfig(isGlobal);
        break;
      default:
        await handleInteractiveConfig();
        break;
    }
  } catch (error) {
    console.error(chalk.red('Configuration operation failed:'), error.message);
    process.exit(1);
  }
}

async function handleGetConfig(key?: string, isGlobal?: boolean): Promise<void> {
  const config = loadConfig(isGlobal);

  if (key) {
    const value = getNestedValue(config, key);
    if (value !== undefined) {
      console.log(chalk.cyan(key), '=', chalk.white(formatValue(value)));
    } else {
      console.log(chalk.red(`Configuration key '${key}' not found`));
      process.exit(1);
    }
  } else {
    // Afficher toute la configuration
    displayConfig(config, isGlobal ? 'Global' : 'Project');
  }
}

async function handleSetConfig(key?: string, value?: any, isGlobal?: boolean): Promise<void> {
  if (!key) {
    console.log(chalk.red('Key is required for set operation'));
    process.exit(1);
  }

  if (value === undefined) {
    const answer = await inquirer.prompt([{
      type: 'input',
      name: 'value',
      message: `Enter value for ${key}:`
    }]);
    value = answer.value;
  }

  const config = loadConfig(isGlobal);
  const parsedValue = parseValue(value);

  setNestedValue(config, key, parsedValue);
  saveConfig(config, isGlobal);

  console.log(chalk.green('✅ Configuration updated:'));
  console.log(chalk.cyan(key), '=', chalk.white(formatValue(parsedValue)));
}

async function handleListConfig(isGlobal?: boolean): Promise<void> {
  const config = loadConfig(isGlobal);
  const scope = isGlobal ? 'Global' : 'Project';

  displayConfig(config, scope);

  // Afficher les configurations par défaut disponibles
  console.log();
  console.log(chalk.white.bold('📝 Available Configuration Keys:'));

  const availableConfigs = getAvailableConfigurations();
  availableConfigs.forEach(cfg => {
    const scopeIcon = cfg.scope === 'global' ? '🌐' : '📁';
    console.log(`   ${scopeIcon} ${chalk.cyan(cfg.key)} (${cfg.type})`);
    console.log(`      ${chalk.gray(cfg.description)}`);
  });
}

async function handleResetConfig(key?: string, isGlobal?: boolean): Promise<void> {
  if (key) {
    // Réinitialiser une clé spécifique
    const confirm = await inquirer.prompt([{
      type: 'confirm',
      name: 'reset',
      message: `Reset configuration key '${key}' to default?`,
      default: false
    }]);

    if (confirm.reset) {
      const config = loadConfig(isGlobal);
      const defaultValue = getDefaultValue(key);

      if (defaultValue !== undefined) {
        setNestedValue(config, key, defaultValue);
        saveConfig(config, isGlobal);
        console.log(chalk.green(`✅ Reset ${key} to default value`));
      } else {
        // Supprimer la clé
        deleteNestedValue(config, key);
        saveConfig(config, isGlobal);
        console.log(chalk.green(`✅ Removed ${key} from configuration`));
      }
    }
  } else {
    // Réinitialiser toute la configuration
    const confirm = await inquirer.prompt([{
      type: 'confirm',
      name: 'resetAll',
      message: `Reset entire ${isGlobal ? 'global' : 'project'} configuration to defaults?`,
      default: false
    }]);

    if (confirm.resetAll) {
      const defaultConfig = getDefaultConfiguration();
      saveConfig(defaultConfig, isGlobal);
      console.log(chalk.green('✅ Configuration reset to defaults'));
    }
  }
}

async function handleEditConfig(isGlobal?: boolean): Promise<void> {
  const configPath = getConfigPath(isGlobal);

  console.log(chalk.cyan('Opening configuration file for editing:'));
  console.log(chalk.gray(configPath));
  console.log();
  console.log(chalk.yellow('⚠️  Make sure to maintain valid YAML syntax'));

  // Tenter d'ouvrir avec l'éditeur par défaut
  try {
    const { execSync } = require('child_process');
    const editor = process.env.EDITOR || process.env.VISUAL ||
                  (os.platform() === 'win32' ? 'notepad' : 'nano');

    execSync(`${editor} "${configPath}"`, { stdio: 'inherit' });

    // Valider après édition
    try {
      yaml.parse(readFileSync(configPath, 'utf8'));
      console.log(chalk.green('✅ Configuration file is valid'));
    } catch (error) {
      console.log(chalk.red('❌ Configuration file contains syntax errors:'));
      console.log(chalk.red(error.message));
    }

  } catch (error) {
    console.log(chalk.red('Could not open editor. Edit manually:'));
    console.log(chalk.cyan(configPath));
  }
}

async function handleInteractiveConfig(): Promise<void> {
  const actions = [
    { name: 'View configuration', value: 'view' },
    { name: 'Set a value', value: 'set' },
    { name: 'Reset to defaults', value: 'reset' },
    { name: 'Edit configuration file', value: 'edit' }
  ];

  const { action } = await inquirer.prompt([{
    type: 'list',
    name: 'action',
    message: 'What would you like to do?',
    choices: actions
  }]);

  const { scope } = await inquirer.prompt([{
    type: 'list',
    name: 'scope',
    message: 'Configuration scope:',
    choices: [
      { name: 'Project (current directory)', value: false },
      { name: 'Global (user-wide)', value: true }
    ]
  }]);

  switch (action) {
    case 'view':
      await handleListConfig(scope);
      break;
    case 'set':
      const availableConfigs = getAvailableConfigurations();
      const { key } = await inquirer.prompt([{
        type: 'list',
        name: 'key',
        message: 'Select configuration key:',
        choices: availableConfigs.map(cfg => ({
          name: `${cfg.key} - ${cfg.description}`,
          value: cfg.key
        }))
      }]);

      const selectedConfig = availableConfigs.find(cfg => cfg.key === key);
      const { value } = await inquirer.prompt([{
        type: selectedConfig?.type === 'boolean' ? 'confirm' : 'input',
        name: 'value',
        message: `Enter value for ${key}:`,
        default: getDefaultValue(key)
      }]);

      await handleSetConfig(key, value, scope);
      break;
    case 'reset':
      await handleResetConfig(undefined, scope);
      break;
    case 'edit':
      await handleEditConfig(scope);
      break;
  }
}

function loadConfig(isGlobal?: boolean): any {
  const configPath = getConfigPath(isGlobal);

  if (!existsSync(configPath)) {
    return getDefaultConfiguration();
  }

  try {
    return yaml.parse(readFileSync(configPath, 'utf8'));
  } catch (error) {
    console.log(chalk.yellow(`Warning: Invalid configuration file, using defaults`));
    return getDefaultConfiguration();
  }
}

function saveConfig(config: any, isGlobal?: boolean): void {
  const configPath = getConfigPath(isGlobal);
  const configDir = path.dirname(configPath);

  if (!existsSync(configDir)) {
    mkdirSync(configDir, { recursive: true });
  }

  writeFileSync(configPath, yaml.stringify(config));
}

function getConfigPath(isGlobal?: boolean): string {
  if (isGlobal) {
    const homeDir = os.homedir();
    return path.join(homeDir, '.claude-stack', 'config.yml');
  } else {
    return path.join(process.cwd(), '.claude-stack.config.yml');
  }
}

function getAvailableConfigurations(): ConfigValue[] {
  return [
    {
      key: 'notifications.slack.enabled',
      value: false,
      description: 'Enable Slack notifications for audit results',
      type: 'boolean',
      scope: 'project'
    },
    {
      key: 'notifications.slack.webhook',
      value: '',
      description: 'Slack webhook URL for notifications',
      type: 'string',
      scope: 'project'
    },
    {
      key: 'notifications.email.enabled',
      value: false,
      description: 'Enable email notifications',
      type: 'boolean',
      scope: 'project'
    },
    {
      key: 'audit.autoFix',
      value: true,
      description: 'Enable automatic fixing of detected issues',
      type: 'boolean',
      scope: 'project'
    },
    {
      key: 'audit.severity',
      value: 'medium',
      description: 'Minimum severity level for audit alerts',
      type: 'string',
      scope: 'project'
    },
    {
      key: 'upgrade.autoUpdate',
      value: false,
      description: 'Automatically apply non-breaking updates',
      type: 'boolean',
      scope: 'project'
    },
    {
      key: 'telemetry.enabled',
      value: true,
      description: 'Send anonymous usage statistics',
      type: 'boolean',
      scope: 'global'
    },
    {
      key: 'editor.default',
      value: 'auto',
      description: 'Default editor for configuration files',
      type: 'string',
      scope: 'global'
    },
    {
      key: 'proxy.http',
      value: '',
      description: 'HTTP proxy URL',
      type: 'string',
      scope: 'global'
    },
    {
      key: 'proxy.https',
      value: '',
      description: 'HTTPS proxy URL',
      type: 'string',
      scope: 'global'
    }
  ];
}

function getDefaultConfiguration(): any {
  return {
    notifications: {
      slack: {
        enabled: false,
        webhook: ''
      },
      email: {
        enabled: false
      }
    },
    audit: {
      autoFix: true,
      severity: 'medium'
    },
    upgrade: {
      autoUpdate: false
    },
    telemetry: {
      enabled: true
    },
    editor: {
      default: 'auto'
    },
    proxy: {
      http: '',
      https: ''
    }
  };
}

function getDefaultValue(key: string): any {
  const config = getDefaultConfiguration();
  return getNestedValue(config, key);
}

function getNestedValue(obj: any, key: string): any {
  return key.split('.').reduce((o, k) => o && o[k], obj);
}

function setNestedValue(obj: any, key: string, value: any): void {
  const keys = key.split('.');
  const lastKey = keys.pop()!;
  const target = keys.reduce((o, k) => {
    if (!o[k]) o[k] = {};
    return o[k];
  }, obj);
  target[lastKey] = value;
}

function deleteNestedValue(obj: any, key: string): void {
  const keys = key.split('.');
  const lastKey = keys.pop()!;
  const target = keys.reduce((o, k) => o && o[k], obj);
  if (target) {
    delete target[lastKey];
  }
}

function parseValue(value: string): any {
  // Essayer de parser comme JSON d'abord
  try {
    return JSON.parse(value);
  } catch {
    // Si ce n'est pas du JSON valide, retourner comme string
    // Sauf pour les valeurs booléennes évidentes
    if (value.toLowerCase() === 'true') return true;
    if (value.toLowerCase() === 'false') return false;

    // Essayer de parser comme nombre
    const num = Number(value);
    if (!isNaN(num) && isFinite(num)) {
      return num;
    }

    return value;
  }
}

function formatValue(value: any): string {
  if (typeof value === 'object') {
    return JSON.stringify(value, null, 2);
  }
  return String(value);
}

function displayConfig(config: any, scope: string): void {
  console.log(chalk.white.bold(`📄 ${scope} Configuration:`));
  console.log();

  if (Object.keys(config).length === 0) {
    console.log(chalk.gray('   No configuration set'));
    return;
  }

  displayConfigRecursive(config, '');
}

function displayConfigRecursive(obj: any, prefix: string): void {
  Object.entries(obj).forEach(([key, value]) => {
    const fullKey = prefix ? `${prefix}.${key}` : key;

    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      console.log(chalk.cyan(`${fullKey}:`));
      displayConfigRecursive(value, fullKey);
    } else {
      console.log(`   ${chalk.cyan(fullKey)} = ${chalk.white(formatValue(value))}`);
    }
  });
}