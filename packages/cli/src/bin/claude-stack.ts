#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { initCommand } from '../commands/init';
import { auditCommand } from '../commands/audit';
import { upgradeCommand } from '../commands/upgrade';

const program = new Command();

// Configuration du CLI principal
program
  .name('claude-stack')
  .description('Claude Stack CLI - Automated security stack management')
  .version('1.0.0')
  .configureOutput({
    writeErr: (str) => process.stderr.write(`[ERROR] ${str}`)
  });

// Commande init
program
  .command('init')
  .description('Initialize Claude Stack in current project')
  .option('-p, --profile <profile>', 'Stack profile (starter|standard|enterprise)', 'standard')
  .option('-n, --project-name <name>', 'Project name')
  .option('-s, --skip-interactive', 'Skip interactive prompts')
  .option('-d, --dry-run', 'Show what would be done without making changes')
  .option('-f, --force', 'Force initialization even if already initialized')
  .action(async (options) => {
    try {
      await initCommand(options);
    } catch (error) {
      console.error(chalk.red('Init failed:'), error.message);
      process.exit(1);
    }
  });

// Commande audit
program
  .command('audit')
  .description('Audit project security and quality')
  .option('-f, --fix', 'Attempt to fix issues automatically')
  .option('--auto-fix', 'Enable aggressive auto-fixing')
  .option('-s, --severity <level>', 'Minimum severity level (low|medium|high|critical)', 'medium')
  .option('-c, --component <name>', 'Audit specific component only')
  .action(async (options) => {
    try {
      await auditCommand(options);
    } catch (error) {
      console.error(chalk.red('Audit failed:'), error.message);
      process.exit(1);
    }
  });

// Commande upgrade
program
  .command('upgrade')
  .description('Upgrade Claude Stack components')
  .option('-d, --dry-run', 'Show available updates without applying them')
  .option('-c, --component <name>', 'Upgrade specific component only')
  .option('-f, --force', 'Force upgrade all components')
  .option('--no-interactive', 'Skip interactive prompts')
  .action(async (options) => {
    try {
      await upgradeCommand(options);
    } catch (error) {
      console.error(chalk.red('Upgrade failed:'), error.message);
      process.exit(1);
    }
  });

// Commande status
program
  .command('status')
  .description('Show Claude Stack status')
  .option('-v, --verbose', 'Show detailed information')
  .action(async (options) => {
    const { statusCommand } = await import('../commands/status');
    try {
      await statusCommand(options);
    } catch (error) {
      console.error(chalk.red('Status check failed:'), error.message);
      process.exit(1);
    }
  });

// Commande doctor
program
  .command('doctor')
  .description('Diagnose common issues')
  .option('--fix', 'Attempt to fix detected issues')
  .action(async (options) => {
    const { doctorCommand } = await import('../commands/doctor');
    try {
      await doctorCommand(options);
    } catch (error) {
      console.error(chalk.red('Doctor check failed:'), error.message);
      process.exit(1);
    }
  });

// Commande config
program
  .command('config')
  .description('Manage Claude Stack configuration')
  .argument('[action]', 'Configuration action (get|set|list|reset)')
  .argument('[key]', 'Configuration key')
  .argument('[value]', 'Configuration value')
  .option('-g, --global', 'Use global configuration')
  .action(async (action, key, value, options) => {
    const { configCommand } = await import('../commands/config');
    try {
      await configCommand({ action, key, value, ...options });
    } catch (error) {
      console.error(chalk.red('Config operation failed:'), error.message);
      process.exit(1);
    }
  });

// Commande profile
program
  .command('profile')
  .description('Manage stack profiles')
  .argument('[action]', 'Profile action (list|show|migrate)')
  .argument('[name]', 'Profile name')
  .action(async (action, name, options) => {
    const { profileCommand } = await import('../commands/profile');
    try {
      await profileCommand({ action, name, ...options });
    } catch (error) {
      console.error(chalk.red('Profile operation failed:'), error.message);
      process.exit(1);
    }
  });

// Commande generate
program
  .command('generate')
  .description('Generate configuration files')
  .argument('<type>', 'Type to generate (workflow|hook|config)')
  .option('-t, --template <name>', 'Template name')
  .option('-o, --output <path>', 'Output path')
  .action(async (type, options) => {
    const { generateCommand } = await import('../commands/generate');
    try {
      await generateCommand({ type, ...options });
    } catch (error) {
      console.error(chalk.red('Generation failed:'), error.message);
      process.exit(1);
    }
  });

// Commande validate
program
  .command('validate')
  .description('Validate Claude Stack configuration')
  .option('-s, --strict', 'Use strict validation')
  .option('--schema <path>', 'Custom schema path')
  .action(async (options) => {
    const { validateCommand } = await import('../commands/validate');
    try {
      await validateCommand(options);
    } catch (error) {
      console.error(chalk.red('Validation failed:'), error.message);
      process.exit(1);
    }
  });

// Commande clean
program
  .command('clean')
  .description('Clean up generated files and caches')
  .option('--cache', 'Clean cache only')
  .option('--artifacts', 'Clean build artifacts only')
  .option('--all', 'Clean everything')
  .action(async (options) => {
    const { cleanCommand } = await import('../commands/clean');
    try {
      await cleanCommand(options);
    } catch (error) {
      console.error(chalk.red('Clean failed:'), error.message);
      process.exit(1);
    }
  });

// Commande info
program
  .command('info')
  .description('Show environment and system information')
  .option('--json', 'Output as JSON')
  .action(async (options) => {
    const { infoCommand } = await import('../commands/info');
    try {
      await infoCommand(options);
    } catch (error) {
      console.error(chalk.red('Info gathering failed:'), error.message);
      process.exit(1);
    }
  });

// Commande docs
program
  .command('docs')
  .description('Access documentation and help')
  .option('-c, --command <command>', 'Show help for specific command')
  .option('-s, --search <query>', 'Search documentation')
  .option('-o, --open', 'Open online documentation in browser')
  .action(async (options) => {
    const { docsCommand } = await import('../commands/docs');
    try {
      await docsCommand(options);
    } catch (error) {
      console.error(chalk.red('Documentation access failed:'), error.message);
      process.exit(1);
    }
  });

// Gestion des erreurs globales
process.on('uncaughtException', (error) => {
  console.error(chalk.red('Uncaught Exception:'), error.message);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error(chalk.red('Unhandled Rejection at:'), promise, 'reason:', reason);
  process.exit(1);
});

// Affichage d'aide amélioré
program.on('--help', () => {
  console.log('');
  console.log(chalk.white.bold('Examples:'));
  console.log('  $ claude-stack init --profile standard');
  console.log('  $ claude-stack audit --auto-fix');
  console.log('  $ claude-stack upgrade --dry-run');
  console.log('  $ claude-stack status --verbose');
  console.log('');
  console.log(chalk.white.bold('Profiles:'));
  console.log('  starter    - Essential tools only (tests + linting)');
  console.log('  standard   - Recommended setup (SAST + secrets + dependencies)');
  console.log('  enterprise - Full stack (governance + compliance + advanced security)');
  console.log('');
  console.log(chalk.white.bold('Documentation:'));
  console.log('  https://docs.anthropic.com/claude-stack');
  console.log('');
});

// Parser les arguments
program.parse();

// Si aucune commande n'est fournie, afficher l'aide
if (!process.argv.slice(2).length) {
  program.outputHelp();
}