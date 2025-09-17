import chalk from 'chalk';
import ora from 'ora';
import { existsSync, readFileSync } from 'fs-extra';
import { execSync } from 'child_process';
import * as yaml from 'yaml';
import * as os from 'os';
import * as path from 'path';

import { DoctorOptions, DiagnosticResult, DiagnosticIssue } from '../types';

export async function doctorCommand(options: DoctorOptions): Promise<void> {
  console.log(chalk.blue.bold('🩺 Claude Stack Doctor'));
  console.log(chalk.gray('Diagnosing common issues...'));
  console.log();

  try {
    const diagnostics = await runDiagnostics();
    displayDiagnostics(diagnostics);

    if (options.fix) {
      await runDiagnosticFixes(diagnostics);
    }

    const summary = generateDiagnosticSummary(diagnostics);
    displayDiagnosticSummary(summary);

  } catch (error) {
    console.error(chalk.red('Doctor check failed:'), error.message);
    process.exit(1);
  }
}

async function runDiagnostics(): Promise<DiagnosticResult[]> {
  const results: DiagnosticResult[] = [];

  // Diagnostic de l'environnement système
  results.push(await diagnoseSystemEnvironment());

  // Diagnostic de Node.js et NPM
  results.push(await diagnoseNodeEnvironment());

  // Diagnostic de Git
  results.push(await diagnoseGitConfiguration());

  // Diagnostic de la configuration Claude Stack
  results.push(await diagnoseClaudeStackConfiguration());

  // Diagnostic des permissions
  results.push(await diagnosePermissions());

  // Diagnostic des conflits de dépendances
  results.push(await diagnoseDependencyConflicts());

  // Diagnostic de l'espace disque
  results.push(await diagnoseDiskSpace());

  return results;
}

async function diagnoseSystemEnvironment(): Promise<DiagnosticResult> {
  const issues: DiagnosticIssue[] = [];

  // Vérifier l'OS supporté
  const platform = os.platform();
  const supportedPlatforms = ['win32', 'darwin', 'linux'];

  if (!supportedPlatforms.includes(platform)) {
    issues.push({
      severity: 'high',
      message: `Unsupported platform: ${platform}`,
      fix: 'Claude Stack supports Windows, macOS, and Linux only',
      category: 'system'
    });
  }

  // Vérifier la version de l'OS
  const release = os.release();
  if (platform === 'win32' && parseFloat(release) < 10) {
    issues.push({
      severity: 'medium',
      message: 'Windows version might be too old',
      fix: 'Consider upgrading to Windows 10 or later',
      category: 'system'
    });
  }

  // Vérifier les variables d'environnement critiques
  const criticalEnvVars = ['PATH', 'HOME', 'USER'];
  if (platform === 'win32') {
    criticalEnvVars.push('USERPROFILE', 'APPDATA');
  }

  criticalEnvVars.forEach(envVar => {
    if (!process.env[envVar]) {
      issues.push({
        severity: 'medium',
        message: `Missing environment variable: ${envVar}`,
        fix: `Set the ${envVar} environment variable`,
        category: 'environment'
      });
    }
  });

  // Vérifier l'encodage des caractères
  const encoding = process.env.LANG || process.env.LC_ALL || 'unknown';
  if (!encoding.includes('UTF-8') && platform !== 'win32') {
    issues.push({
      severity: 'low',
      message: 'Non-UTF-8 encoding detected',
      fix: 'Set LANG=en_US.UTF-8 in your shell profile',
      category: 'environment'
    });
  }

  return {
    component: 'System Environment',
    status: issues.length === 0 ? 'healthy' : (issues.some(i => i.severity === 'high') ? 'error' : 'warning'),
    issues
  };
}

async function diagnoseNodeEnvironment(): Promise<DiagnosticResult> {
  const issues: DiagnosticIssue[] = [];

  try {
    // Vérifier la version de Node.js
    const nodeVersion = execSync('node --version', { encoding: 'utf8' }).trim();
    const majorVersion = parseInt(nodeVersion.replace('v', '').split('.')[0]);

    if (majorVersion < 16) {
      issues.push({
        severity: 'high',
        message: `Node.js version ${nodeVersion} is too old`,
        fix: 'Upgrade to Node.js 16 or later',
        category: 'nodejs',
        autoFix: async () => {
          console.log(chalk.yellow('Please manually upgrade Node.js to version 16 or later'));
          return false;
        }
      });
    } else if (majorVersion < 18) {
      issues.push({
        severity: 'medium',
        message: `Node.js version ${nodeVersion} is supported but not recommended`,
        fix: 'Consider upgrading to Node.js 18 LTS',
        category: 'nodejs'
      });
    }

    // Vérifier NPM
    const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
    const npmMajor = parseInt(npmVersion.split('.')[0]);

    if (npmMajor < 8) {
      issues.push({
        severity: 'medium',
        message: `NPM version ${npmVersion} is old`,
        fix: 'Update NPM: npm install -g npm@latest',
        category: 'npm',
        autoFix: async () => {
          try {
            execSync('npm install -g npm@latest', { stdio: 'inherit' });
            return true;
          } catch {
            return false;
          }
        }
      });
    }

    // Vérifier le cache NPM
    try {
      execSync('npm cache verify', { stdio: 'pipe' });
    } catch {
      issues.push({
        severity: 'low',
        message: 'NPM cache is corrupted',
        fix: 'Clean NPM cache: npm cache clean --force',
        category: 'npm',
        autoFix: async () => {
          try {
            execSync('npm cache clean --force', { stdio: 'inherit' });
            return true;
          } catch {
            return false;
          }
        }
      });
    }

  } catch (error) {
    issues.push({
      severity: 'high',
      message: 'Node.js is not installed or not in PATH',
      fix: 'Install Node.js from https://nodejs.org/',
      category: 'nodejs'
    });
  }

  // Vérifier les permissions du répertoire global
  try {
    const globalPath = execSync('npm config get prefix', { encoding: 'utf8' }).trim();
    if (!existsSync(globalPath)) {
      issues.push({
        severity: 'medium',
        message: 'NPM global directory does not exist',
        fix: 'Reinstall Node.js or configure NPM properly',
        category: 'npm'
      });
    }
  } catch (error) {
    issues.push({
      severity: 'low',
      message: 'Cannot determine NPM global path',
      fix: 'Check NPM configuration',
      category: 'npm'
    });
  }

  return {
    component: 'Node.js Environment',
    status: issues.length === 0 ? 'healthy' : (issues.some(i => i.severity === 'high') ? 'error' : 'warning'),
    issues
  };
}

async function diagnoseGitConfiguration(): Promise<DiagnosticResult> {
  const issues: DiagnosticIssue[] = [];

  try {
    // Vérifier Git
    const gitVersion = execSync('git --version', { encoding: 'utf8' }).trim();

    // Vérifier la configuration Git
    const userName = execSync('git config --global user.name', { encoding: 'utf8', stdio: 'pipe' }).trim();
    const userEmail = execSync('git config --global user.email', { encoding: 'utf8', stdio: 'pipe' }).trim();

    if (!userName) {
      issues.push({
        severity: 'medium',
        message: 'Git user.name not configured',
        fix: 'Set Git username: git config --global user.name "Your Name"',
        category: 'git',
        autoFix: async () => {
          console.log(chalk.yellow('Please set your Git username manually'));
          return false;
        }
      });
    }

    if (!userEmail) {
      issues.push({
        severity: 'medium',
        message: 'Git user.email not configured',
        fix: 'Set Git email: git config --global user.email "your@email.com"',
        category: 'git',
        autoFix: async () => {
          console.log(chalk.yellow('Please set your Git email manually'));
          return false;
        }
      });
    }

    // Vérifier si on est dans un repo Git
    if (existsSync('.git')) {
      // Vérifier l'état du repo
      try {
        const status = execSync('git status --porcelain', { encoding: 'utf8' });
        if (status.length > 100) {
          issues.push({
            severity: 'low',
            message: 'Many uncommitted changes detected',
            fix: 'Commit or stash your changes',
            category: 'git'
          });
        }
      } catch (error) {
        issues.push({
          severity: 'medium',
          message: 'Git repository is in an inconsistent state',
          fix: 'Check git status and resolve any issues',
          category: 'git'
        });
      }
    }

  } catch (error) {
    issues.push({
      severity: 'high',
      message: 'Git is not installed or not in PATH',
      fix: 'Install Git from https://git-scm.com/',
      category: 'git'
    });
  }

  return {
    component: 'Git Configuration',
    status: issues.length === 0 ? 'healthy' : (issues.some(i => i.severity === 'high') ? 'error' : 'warning'),
    issues
  };
}

async function diagnoseClaudeStackConfiguration(): Promise<DiagnosticResult> {
  const issues: DiagnosticIssue[] = [];

  // Vérifier la présence de la configuration
  if (!existsSync('.claude-stack.yml')) {
    issues.push({
      severity: 'high',
      message: 'Claude Stack not initialized',
      fix: 'Run: claude-stack init',
      category: 'configuration'
    });

    return {
      component: 'Claude Stack Configuration',
      status: 'error',
      issues
    };
  }

  try {
    // Vérifier la validité du YAML
    const config = yaml.parse(readFileSync('.claude-stack.yml', 'utf8'));

    // Vérifier les champs obligatoires
    const requiredFields = ['name', 'profile', 'version'];
    requiredFields.forEach(field => {
      if (!config[field]) {
        issues.push({
          severity: 'medium',
          message: `Missing required field: ${field}`,
          fix: `Add ${field} to .claude-stack.yml`,
          category: 'configuration'
        });
      }
    });

    // Vérifier la validité du profil
    const validProfiles = ['starter', 'standard', 'enterprise'];
    if (!validProfiles.includes(config.profile)) {
      issues.push({
        severity: 'high',
        message: `Invalid profile: ${config.profile}`,
        fix: `Use one of: ${validProfiles.join(', ')}`,
        category: 'configuration'
      });
    }

    // Vérifier la configuration Claude Code
    if (!existsSync('.claude')) {
      issues.push({
        severity: 'medium',
        message: 'Claude Code configuration directory missing',
        fix: 'Reinitialize: claude-stack init --force',
        category: 'claude'
      });
    } else {
      if (!existsSync('.claude/mcp.json')) {
        issues.push({
          severity: 'medium',
          message: 'MCP configuration missing',
          fix: 'Regenerate Claude configuration',
          category: 'claude'
        });
      }

      if (!existsSync('.claude/hooks.json')) {
        issues.push({
          severity: 'low',
          message: 'Hooks configuration missing',
          fix: 'Regenerate Claude configuration',
          category: 'claude'
        });
      }
    }

  } catch (error) {
    issues.push({
      severity: 'high',
      message: 'Invalid YAML configuration',
      fix: 'Fix .claude-stack.yml syntax errors',
      category: 'configuration'
    });
  }

  return {
    component: 'Claude Stack Configuration',
    status: issues.length === 0 ? 'healthy' : (issues.some(i => i.severity === 'high') ? 'error' : 'warning'),
    issues
  };
}

async function diagnosePermissions(): Promise<DiagnosticResult> {
  const issues: DiagnosticIssue[] = [];

  // Vérifier les permissions d'écriture dans le répertoire courant
  try {
    const testFile = '.claude-stack-test-write';
    require('fs').writeFileSync(testFile, 'test');
    require('fs').unlinkSync(testFile);
  } catch (error) {
    issues.push({
      severity: 'high',
      message: 'No write permission in current directory',
      fix: 'Check directory permissions or run as administrator',
      category: 'permissions'
    });
  }

  // Vérifier les permissions pour le répertoire .claude-meta
  if (!existsSync('.claude-meta')) {
    try {
      require('fs').mkdirSync('.claude-meta');
      require('fs').rmdirSync('.claude-meta');
    } catch (error) {
      issues.push({
        severity: 'medium',
        message: 'Cannot create .claude-meta directory',
        fix: 'Check permissions or create directory manually',
        category: 'permissions'
      });
    }
  }

  return {
    component: 'File Permissions',
    status: issues.length === 0 ? 'healthy' : (issues.some(i => i.severity === 'high') ? 'error' : 'warning'),
    issues
  };
}

async function diagnoseDependencyConflicts(): Promise<DiagnosticResult> {
  const issues: DiagnosticIssue[] = [];

  if (!existsSync('package.json')) {
    return {
      component: 'Dependency Conflicts',
      status: 'healthy',
      issues: []
    };
  }

  try {
    // Vérifier les conflits de versions
    const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));

    // Vérifier si claude-stack est installé avec une version conflictuelle
    const claudeStackVersion = packageJson.dependencies?.['@claude/stack'] ||
                              packageJson.devDependencies?.['@claude/stack'];

    if (claudeStackVersion && claudeStackVersion.includes('^') && !claudeStackVersion.includes('1.')) {
      issues.push({
        severity: 'medium',
        message: 'Claude Stack version mismatch',
        fix: 'Update to compatible version',
        category: 'dependencies'
      });
    }

    // Vérifier les conflits de linting
    const hasEslint = packageJson.dependencies?.eslint || packageJson.devDependencies?.eslint;
    const hasPrettier = packageJson.dependencies?.prettier || packageJson.devDependencies?.prettier;

    if (hasEslint && hasPrettier) {
      // Vérifier si eslint-config-prettier est installé
      const hasEslintPrettier = packageJson.dependencies?.['eslint-config-prettier'] ||
                               packageJson.devDependencies?.['eslint-config-prettier'];

      if (!hasEslintPrettier) {
        issues.push({
          severity: 'low',
          message: 'ESLint and Prettier conflict possible',
          fix: 'Install eslint-config-prettier to avoid conflicts',
          category: 'dependencies',
          autoFix: async () => {
            try {
              execSync('npm install --save-dev eslint-config-prettier', { stdio: 'inherit' });
              return true;
            } catch {
              return false;
            }
          }
        });
      }
    }

  } catch (error) {
    issues.push({
      severity: 'medium',
      message: 'Cannot analyze package.json',
      fix: 'Check package.json syntax',
      category: 'dependencies'
    });
  }

  return {
    component: 'Dependency Conflicts',
    status: issues.length === 0 ? 'healthy' : 'warning',
    issues
  };
}

async function diagnoseDiskSpace(): Promise<DiagnosticResult> {
  const issues: DiagnosticIssue[] = [];

  try {
    const stats = require('fs').statSync('.');
    const free = require('fs').statSync('.').free || 0;

    // Cette vérification est approximative car statSync ne donne pas l'espace libre
    // On utilise une approche différente selon la plateforme

    if (os.platform() === 'win32') {
      try {
        const output = execSync('dir /-c', { encoding: 'utf8' });
        // Analyser la sortie pour extraire l'espace libre (implémentation simplifiée)
      } catch (error) {
        // Ignorer si on ne peut pas obtenir l'info
      }
    } else {
      try {
        const output = execSync('df .', { encoding: 'utf8' });
        const lines = output.split('\n');
        if (lines.length > 1) {
          const parts = lines[1].split(/\s+/);
          const available = parseInt(parts[3]) * 1024; // Convertir en bytes

          if (available < 1024 * 1024 * 100) { // Moins de 100MB
            issues.push({
              severity: 'high',
              message: 'Low disk space (less than 100MB)',
              fix: 'Free up disk space',
              category: 'system'
            });
          } else if (available < 1024 * 1024 * 500) { // Moins de 500MB
            issues.push({
              severity: 'medium',
              message: 'Limited disk space (less than 500MB)',
              fix: 'Consider freeing up disk space',
              category: 'system'
            });
          }
        }
      } catch (error) {
        // Ignorer si on ne peut pas obtenir l'info
      }
    }

  } catch (error) {
    // Ignorer les erreurs de vérification d'espace disque
  }

  return {
    component: 'Disk Space',
    status: issues.length === 0 ? 'healthy' : (issues.some(i => i.severity === 'high') ? 'error' : 'warning'),
    issues
  };
}

function displayDiagnostics(results: DiagnosticResult[]): void {
  console.log(chalk.white.bold('🔍 Diagnostic Results:'));
  console.log();

  results.forEach(result => {
    const statusIcon = result.status === 'healthy' ? '✅' :
                      result.status === 'warning' ? '⚠️' : '❌';
    const statusColor = result.status === 'healthy' ? 'green' :
                       result.status === 'warning' ? 'yellow' : 'red';

    console.log(`${statusIcon} ${chalk.white.bold(result.component)} ${chalk[statusColor](result.status.toUpperCase())}`);

    if (result.issues.length > 0) {
      result.issues.forEach(issue => {
        const severityIcon = issue.severity === 'high' ? '🔴' :
                           issue.severity === 'medium' ? '🟡' : '🔵';
        const severityColor = issue.severity === 'high' ? 'red' :
                             issue.severity === 'medium' ? 'yellow' : 'blue';

        console.log(`   ${severityIcon} ${chalk[severityColor](issue.severity.toUpperCase())}: ${issue.message}`);
        console.log(`      ${chalk.gray('Fix:')} ${issue.fix}`);
        if (issue.category) {
          console.log(`      ${chalk.gray('Category:')} ${issue.category}`);
        }
      });
    }
    console.log();
  });
}

async function runDiagnosticFixes(results: DiagnosticResult[]): Promise<void> {
  const spinner = ora('Running diagnostic fixes...').start();
  let fixedCount = 0;

  for (const result of results) {
    for (const issue of result.issues) {
      if (issue.autoFix) {
        try {
          const success = await issue.autoFix();
          if (success) {
            fixedCount++;
          }
        } catch (error) {
          // Continue with other fixes
        }
      }
    }
  }

  spinner.succeed(`Auto-fixed ${fixedCount} issues`);
}

function generateDiagnosticSummary(results: DiagnosticResult[]): any {
  const total = results.length;
  const healthy = results.filter(r => r.status === 'healthy').length;
  const warnings = results.filter(r => r.status === 'warning').length;
  const errors = results.filter(r => r.status === 'error').length;

  const totalIssues = results.reduce((sum, r) => sum + r.issues.length, 0);
  const autoFixable = results.reduce((sum, r) =>
    sum + r.issues.filter(i => !!i.autoFix).length, 0);

  const criticalIssues = results.reduce((sum, r) =>
    sum + r.issues.filter(i => i.severity === 'high').length, 0);

  return { total, healthy, warnings, errors, totalIssues, autoFixable, criticalIssues };
}

function displayDiagnosticSummary(summary: any): void {
  console.log(chalk.white.bold('📋 Diagnostic Summary:'));
  console.log(`   Components: ${summary.total} total, ${summary.healthy} healthy, ${summary.warnings} warnings, ${summary.errors} errors`);
  console.log(`   Issues: ${summary.totalIssues} total, ${summary.criticalIssues} critical, ${summary.autoFixable} auto-fixable`);
  console.log();

  if (summary.errors > 0) {
    console.log(chalk.red('❌ Critical issues detected - Claude Stack may not work properly'));
    console.log(chalk.gray('Run with --fix to attempt automatic repairs'));
  } else if (summary.criticalIssues > 0) {
    console.log(chalk.red('⚠️  High severity issues detected'));
  } else if (summary.warnings > 0) {
    console.log(chalk.yellow('⚠️  Some issues detected but Claude Stack should work'));
  } else {
    console.log(chalk.green('✅ All diagnostic checks passed!'));
  }

  console.log();
  console.log(chalk.white.bold('🔧 Suggested Actions:'));
  console.log(chalk.gray('  • Run with --fix to auto-repair issues'));
  console.log(chalk.gray('  • Check '), chalk.cyan('claude-stack status'), chalk.gray(' for project health'));
  console.log(chalk.gray('  • Run '), chalk.cyan('claude-stack audit'), chalk.gray(' for security scan'));
}