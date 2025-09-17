import chalk from 'chalk';
import ora from 'ora';
import { existsSync, readFileSync } from 'fs-extra';
import { execSync } from 'child_process';
import * as yaml from 'yaml';

import { AuditOptions, AuditResult, AuditIssue } from '../types';

export async function auditCommand(options: AuditOptions): Promise<void> {
  const spinner = ora();

  try {
    console.log(chalk.blue.bold('🔍 Claude Stack Audit'));
    console.log();

    // Vérifier que le projet est initialisé
    if (!existsSync('.claude-stack.yml')) {
      console.log(chalk.red('❌ No Claude Stack configuration found'));
      console.log(chalk.gray('Run: claude-stack init'));
      return;
    }

    // Charger la configuration
    const config = yaml.parse(readFileSync('.claude-stack.yml', 'utf8'));

    // Exécuter l'audit
    spinner.start('Running security audit...');
    const auditResults = await runAudit(config, options);
    spinner.stop();

    // Afficher les résultats
    displayAuditResults(auditResults);

    // Auto-fix si demandé
    if (options.autoFix) {
      await runAutoFix(auditResults);
    }

    // Résumé final
    const summary = generateSummary(auditResults);
    displaySummary(summary);

  } catch (error) {
    spinner.fail('Audit failed');
    console.error(chalk.red('Error:'), error.message);
    process.exit(1);
  }
}

async function runAudit(config: any, options: AuditOptions): Promise<AuditResult[]> {
  const results: AuditResult[] = [];

  // Audit des tests
  if (!options.component || options.component === 'testing') {
    results.push(await auditTesting(config));
  }

  // Audit de sécurité
  if (!options.component || options.component === 'security') {
    results.push(await auditSecurity(config));
  }

  // Audit de qualité
  if (!options.component || options.component === 'quality') {
    results.push(await auditQuality(config));
  }

  // Audit des dépendances
  if (!options.component || options.component === 'dependencies') {
    results.push(await auditDependencies(config));
  }

  // Audit de la configuration
  if (!options.component || options.component === 'configuration') {
    results.push(await auditConfiguration(config));
  }

  return results;
}

async function auditTesting(config: any): Promise<AuditResult> {
  const issues: AuditIssue[] = [];

  // Vérifier la présence des tests
  if (!existsSync('src') && !existsSync('test') && !existsSync('tests')) {
    issues.push({
      severity: 'high',
      message: 'No test directory found',
      fix: 'Create test directory and add tests',
      autoFix: async () => {
        execSync('mkdir -p tests');
        return true;
      }
    });
  }

  // Vérifier la configuration de coverage
  const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
  if (!packageJson.scripts?.['test:coverage']) {
    issues.push({
      severity: 'medium',
      message: 'No coverage script found',
      fix: 'Add "test:coverage" script to package.json',
      autoFix: async () => {
        packageJson.scripts = packageJson.scripts || {};
        packageJson.scripts['test:coverage'] = 'jest --coverage';
        require('fs').writeFileSync('package.json', JSON.stringify(packageJson, null, 2));
        return true;
      }
    });
  }

  // Exécuter les tests et vérifier le coverage
  try {
    const testResult = execSync('npm test', { encoding: 'utf8', stdio: 'pipe' });

    // Vérifier le seuil de coverage
    if (testResult.includes('Coverage threshold')) {
      issues.push({
        severity: 'medium',
        message: 'Coverage below threshold',
        fix: 'Increase test coverage'
      });
    }
  } catch (error) {
    issues.push({
      severity: 'high',
      message: 'Tests are failing',
      fix: 'Fix failing tests'
    });
  }

  return {
    component: 'testing',
    status: issues.length === 0 ? 'healthy' : (issues.some(i => i.severity === 'high') ? 'error' : 'warning'),
    issues,
    autoFixable: issues.some(i => !!i.autoFix)
  };
}

async function auditSecurity(config: any): Promise<AuditResult> {
  const issues: AuditIssue[] = [];

  // Audit des vulnérabilités npm
  try {
    execSync('npm audit --audit-level=high', { stdio: 'pipe' });
  } catch (error) {
    issues.push({
      severity: 'high',
      message: 'High/Critical npm vulnerabilities found',
      fix: 'Run: npm audit fix',
      autoFix: async () => {
        try {
          execSync('npm audit fix', { stdio: 'inherit' });
          return true;
        } catch {
          return false;
        }
      }
    });
  }

  // Vérifier la présence de Semgrep
  if (!existsSync('node_modules/.bin/semgrep') && config.profile !== 'starter') {
    issues.push({
      severity: 'medium',
      message: 'Semgrep not installed',
      fix: 'Install semgrep for SAST scanning',
      autoFix: async () => {
        try {
          execSync('npm install --save-dev semgrep', { stdio: 'inherit' });
          return true;
        } catch {
          return false;
        }
      }
    });
  }

  // Exécuter Semgrep si disponible
  if (existsSync('node_modules/.bin/semgrep')) {
    try {
      execSync('npx semgrep --config=auto --quiet .', { stdio: 'pipe' });
    } catch (error) {
      const output = error.stdout?.toString() || '';
      if (output.includes('findings')) {
        issues.push({
          severity: 'medium',
          message: 'SAST findings detected',
          fix: 'Review and fix SAST findings'
        });
      }
    }
  }

  // Vérifier les secrets
  if (existsSync('.env') || existsSync('.env.local')) {
    issues.push({
      severity: 'low',
      message: 'Environment files present',
      fix: 'Ensure .env files are in .gitignore'
    });
  }

  return {
    component: 'security',
    status: issues.length === 0 ? 'healthy' : (issues.some(i => i.severity === 'high') ? 'error' : 'warning'),
    issues,
    autoFixable: issues.some(i => !!i.autoFix)
  };
}

async function auditQuality(config: any): Promise<AuditResult> {
  const issues: AuditIssue[] = [];

  // Vérifier ESLint
  if (!existsSync('.eslintrc.json') && !existsSync('.eslintrc.js')) {
    issues.push({
      severity: 'medium',
      message: 'No ESLint configuration found',
      fix: 'Add ESLint configuration',
      autoFix: async () => {
        const eslintConfig = {
          extends: ['eslint:recommended'],
          env: { node: true, es2021: true },
          parserOptions: { ecmaVersion: 12 }
        };
        require('fs').writeFileSync('.eslintrc.json', JSON.stringify(eslintConfig, null, 2));
        return true;
      }
    });
  }

  // Vérifier Prettier
  if (!existsSync('.prettierrc') && !existsSync('.prettierrc.json')) {
    issues.push({
      severity: 'low',
      message: 'No Prettier configuration found',
      fix: 'Add Prettier configuration',
      autoFix: async () => {
        const prettierConfig = {
          semi: true,
          singleQuote: true,
          tabWidth: 2,
          trailingComma: 'es5'
        };
        require('fs').writeFileSync('.prettierrc.json', JSON.stringify(prettierConfig, null, 2));
        return true;
      }
    });
  }

  // Exécuter ESLint
  try {
    execSync('npx eslint . --quiet', { stdio: 'pipe' });
  } catch (error) {
    issues.push({
      severity: 'medium',
      message: 'ESLint violations found',
      fix: 'Fix ESLint violations',
      autoFix: async () => {
        try {
          execSync('npx eslint . --fix', { stdio: 'inherit' });
          return true;
        } catch {
          return false;
        }
      }
    });
  }

  return {
    component: 'quality',
    status: issues.length === 0 ? 'healthy' : 'warning',
    issues,
    autoFixable: issues.some(i => !!i.autoFix)
  };
}

async function auditDependencies(config: any): Promise<AuditResult> {
  const issues: AuditIssue[] = [];

  // Vérifier les dépendances obsolètes
  try {
    const outdated = execSync('npm outdated --json', { encoding: 'utf8', stdio: 'pipe' });
    const packages = JSON.parse(outdated);

    if (Object.keys(packages).length > 0) {
      issues.push({
        severity: 'low',
        message: `${Object.keys(packages).length} packages are outdated`,
        fix: 'Update dependencies',
        autoFix: async () => {
          try {
            execSync('npm update', { stdio: 'inherit' });
            return true;
          } catch {
            return false;
          }
        }
      });
    }
  } catch (error) {
    // npm outdated exits with 1 when there are outdated packages
  }

  // Vérifier la présence de lock file
  if (!existsSync('package-lock.json') && !existsSync('yarn.lock')) {
    issues.push({
      severity: 'medium',
      message: 'No lock file found',
      fix: 'Run npm install to generate package-lock.json'
    });
  }

  return {
    component: 'dependencies',
    status: issues.length === 0 ? 'healthy' : 'warning',
    issues,
    autoFixable: issues.some(i => !!i.autoFix)
  };
}

async function auditConfiguration(config: any): Promise<AuditResult> {
  const issues: AuditIssue[] = [];

  // Vérifier .gitignore
  if (!existsSync('.gitignore')) {
    issues.push({
      severity: 'medium',
      message: 'No .gitignore file found',
      fix: 'Create .gitignore file',
      autoFix: async () => {
        const gitignoreContent = `
node_modules/
.env
.env.local
dist/
coverage/
*.log
`;
        require('fs').writeFileSync('.gitignore', gitignoreContent.trim());
        return true;
      }
    });
  }

  // Vérifier la configuration Claude
  if (!existsSync('.claude/mcp.json')) {
    issues.push({
      severity: 'high',
      message: 'Claude MCP configuration missing',
      fix: 'Reinitialize Claude Stack configuration'
    });
  }

  return {
    component: 'configuration',
    status: issues.length === 0 ? 'healthy' : (issues.some(i => i.severity === 'high') ? 'error' : 'warning'),
    issues,
    autoFixable: issues.some(i => !!i.autoFix)
  };
}

function displayAuditResults(results: AuditResult[]): void {
  console.log(chalk.white.bold('📊 Audit Results:'));
  console.log();

  results.forEach(result => {
    const statusIcon = getStatusIcon(result.status);
    const statusColor = getStatusColor(result.status);

    console.log(`${statusIcon} ${chalk.white.bold(result.component)} ${chalk[statusColor](result.status.toUpperCase())}`);

    if (result.issues.length > 0) {
      result.issues.forEach(issue => {
        const severityIcon = getSeverityIcon(issue.severity);
        const severityColor = getSeverityColor(issue.severity);

        console.log(`   ${severityIcon} ${chalk[severityColor](issue.severity.toUpperCase())}: ${issue.message}`);
        if (issue.fix) {
          console.log(`      ${chalk.gray('Fix:')} ${issue.fix}`);
        }
      });
    }
    console.log();
  });
}

async function runAutoFix(results: AuditResult[]): Promise<void> {
  const spinner = ora('Running auto-fix...').start();
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

function generateSummary(results: AuditResult[]): any {
  const total = results.length;
  const healthy = results.filter(r => r.status === 'healthy').length;
  const warnings = results.filter(r => r.status === 'warning').length;
  const errors = results.filter(r => r.status === 'error').length;

  const totalIssues = results.reduce((sum, r) => sum + r.issues.length, 0);
  const autoFixable = results.reduce((sum, r) => sum + r.issues.filter(i => !!i.autoFix).length, 0);

  return { total, healthy, warnings, errors, totalIssues, autoFixable };
}

function displaySummary(summary: any): void {
  console.log(chalk.white.bold('📋 Summary:'));
  console.log(`   Components: ${summary.total} total, ${summary.healthy} healthy, ${summary.warnings} warnings, ${summary.errors} errors`);
  console.log(`   Issues: ${summary.totalIssues} total, ${summary.autoFixable} auto-fixable`);
  console.log();

  if (summary.errors > 0) {
    console.log(chalk.red('❌ Fix critical issues before proceeding'));
  } else if (summary.warnings > 0) {
    console.log(chalk.yellow('⚠️  Consider fixing warnings for better security'));
  } else {
    console.log(chalk.green('✅ All components are healthy!'));
  }
}

function getStatusIcon(status: string): string {
  switch (status) {
    case 'healthy': return '✅';
    case 'warning': return '⚠️';
    case 'error': return '❌';
    default: return '❓';
  }
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'healthy': return 'green';
    case 'warning': return 'yellow';
    case 'error': return 'red';
    default: return 'gray';
  }
}

function getSeverityIcon(severity: string): string {
  switch (severity) {
    case 'critical': return '🔥';
    case 'high': return '🔴';
    case 'medium': return '🟡';
    case 'low': return '🔵';
    default: return '⚪';
  }
}

function getSeverityColor(severity: string): string {
  switch (severity) {
    case 'critical': return 'redBright';
    case 'high': return 'red';
    case 'medium': return 'yellow';
    case 'low': return 'blue';
    default: return 'gray';
  }
}