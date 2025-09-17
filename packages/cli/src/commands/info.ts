import chalk from 'chalk';
import { existsSync, readFileSync } from 'fs-extra';
import { execSync } from 'child_process';
import * as yaml from 'yaml';
import * as os from 'os';
import * as path from 'path';

import { InfoOptions } from '../types';

interface SystemInfo {
  platform: string;
  architecture: string;
  nodeVersion: string;
  npmVersion: string;
  gitVersion?: string;
  memory: {
    total: string;
    free: string;
  };
  disk: {
    total?: string;
    free?: string;
  };
}

interface ProjectInfo {
  name?: string;
  version?: string;
  profile?: string;
  created?: string;
  lastUpdated?: string;
  components?: any;
  packageManager?: string;
  dependencies?: number;
  devDependencies?: number;
}

interface ClaudeStackInfo {
  version?: string;
  configValid: boolean;
  mcpServers?: number;
  hooks?: number;
  lastAudit?: string;
  lastUpgrade?: string;
}

export async function infoCommand(options: InfoOptions): Promise<void> {
  console.log(chalk.blue.bold('ℹ️  Claude Stack Information'));
  console.log();

  try {
    const systemInfo = await getSystemInfo();
    const projectInfo = await getProjectInfo();
    const claudeStackInfo = await getClaudeStackInfo();

    if (options.json) {
      // Output JSON format
      const allInfo = {
        system: systemInfo,
        project: projectInfo,
        claudeStack: claudeStackInfo,
        timestamp: new Date().toISOString()
      };
      console.log(JSON.stringify(allInfo, null, 2));
    } else {
      // Output human-readable format
      displaySystemInfo(systemInfo);
      displayProjectInfo(projectInfo);
      displayClaudeStackInfo(claudeStackInfo);
      displayEnvironmentInfo();
      displayTroubleshootingInfo();
    }

  } catch (error) {
    console.error(chalk.red('Failed to gather information:'), error.message);
    process.exit(1);
  }
}

async function getSystemInfo(): Promise<SystemInfo> {
  const info: SystemInfo = {
    platform: `${os.platform()} ${os.release()}`,
    architecture: os.arch(),
    nodeVersion: process.version,
    npmVersion: 'unknown',
    memory: {
      total: formatBytes(os.totalmem()),
      free: formatBytes(os.freemem())
    },
    disk: {}
  };

  // Get NPM version
  try {
    info.npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
  } catch (error) {
    // NPM not available
  }

  // Get Git version
  try {
    const gitOutput = execSync('git --version', { encoding: 'utf8' });
    info.gitVersion = gitOutput.replace('git version ', '').trim();
  } catch (error) {
    // Git not available
  }

  // Get disk space (Unix/macOS only)
  if (os.platform() !== 'win32') {
    try {
      const dfOutput = execSync('df -h .', { encoding: 'utf8' });
      const lines = dfOutput.split('\n');
      if (lines.length > 1) {
        const parts = lines[1].split(/\s+/);
        if (parts.length >= 4) {
          info.disk.total = parts[1];
          info.disk.free = parts[3];
        }
      }
    } catch (error) {
      // Disk info not available
    }
  }

  return info;
}

async function getProjectInfo(): Promise<ProjectInfo> {
  const info: ProjectInfo = {};

  // Check package.json
  if (existsSync('package.json')) {
    try {
      const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
      info.name = packageJson.name;
      info.version = packageJson.version;

      if (packageJson.dependencies) {
        info.dependencies = Object.keys(packageJson.dependencies).length;
      }

      if (packageJson.devDependencies) {
        info.devDependencies = Object.keys(packageJson.devDependencies).length;
      }

      // Detect package manager
      if (existsSync('package-lock.json')) {
        info.packageManager = 'npm';
      } else if (existsSync('yarn.lock')) {
        info.packageManager = 'yarn';
      } else if (existsSync('pnpm-lock.yaml')) {
        info.packageManager = 'pnpm';
      }
    } catch (error) {
      // Invalid package.json
    }
  }

  // Check Claude Stack config
  if (existsSync('.claude-stack.yml')) {
    try {
      const config = yaml.parse(readFileSync('.claude-stack.yml', 'utf8'));
      if (!info.name) info.name = config.name;
      info.profile = config.profile;
      info.created = config.created;
      info.lastUpdated = config.lastUpdated;
      info.components = config.components;
    } catch (error) {
      // Invalid Claude Stack config
    }
  }

  return info;
}

async function getClaudeStackInfo(): Promise<ClaudeStackInfo> {
  const info: ClaudeStackInfo = {
    configValid: false,
    mcpServers: 0,
    hooks: 0
  };

  // Check Claude Stack CLI version
  try {
    const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
    const claudeStackDep = packageJson.dependencies?.['@claude/stack'] ||
                          packageJson.devDependencies?.['@claude/stack'];
    if (claudeStackDep) {
      info.version = claudeStackDep.replace(/[\^~]/, '');
    }
  } catch (error) {
    // No package.json or Claude Stack not installed
  }

  // Check configuration validity
  if (existsSync('.claude-stack.yml')) {
    try {
      yaml.parse(readFileSync('.claude-stack.yml', 'utf8'));
      info.configValid = true;
    } catch (error) {
      info.configValid = false;
    }
  }

  // Check MCP servers
  if (existsSync('.claude/mcp.json')) {
    try {
      const mcpConfig = JSON.parse(readFileSync('.claude/mcp.json', 'utf8'));
      if (mcpConfig.mcpServers) {
        info.mcpServers = Object.keys(mcpConfig.mcpServers).length;
      }
    } catch (error) {
      // Invalid MCP config
    }
  }

  // Check hooks
  if (existsSync('.claude/hooks.json')) {
    try {
      const hooksConfig = JSON.parse(readFileSync('.claude/hooks.json', 'utf8'));
      if (hooksConfig.hooks) {
        info.hooks = Object.values(hooksConfig.hooks)
          .reduce((total: number, hookArray: any) => total + (Array.isArray(hookArray) ? hookArray.length : 0), 0);
      }
    } catch (error) {
      // Invalid hooks config
    }
  }

  // Check for audit/upgrade history (if logs exist)
  const logPatterns = [
    { pattern: '.claude-meta/audit.log', key: 'lastAudit' },
    { pattern: '.claude-meta/upgrade.log', key: 'lastUpgrade' }
  ];

  logPatterns.forEach(({ pattern, key }) => {
    if (existsSync(pattern)) {
      try {
        const stats = require('fs').statSync(pattern);
        info[key as keyof ClaudeStackInfo] = stats.mtime.toISOString().split('T')[0];
      } catch (error) {
        // Can't read file stats
      }
    }
  });

  return info;
}

function displaySystemInfo(info: SystemInfo): void {
  console.log(chalk.white.bold('🖥️  System Information:'));
  console.log(`   Platform: ${chalk.cyan(info.platform)}`);
  console.log(`   Architecture: ${chalk.cyan(info.architecture)}`);
  console.log(`   Node.js: ${chalk.cyan(info.nodeVersion)}`);
  console.log(`   NPM: ${chalk.cyan(info.npmVersion)}`);
  if (info.gitVersion) {
    console.log(`   Git: ${chalk.cyan(info.gitVersion)}`);
  }
  console.log(`   Memory: ${chalk.cyan(`${info.memory.free} free / ${info.memory.total} total`)}`);
  if (info.disk.total && info.disk.free) {
    console.log(`   Disk: ${chalk.cyan(`${info.disk.free} free / ${info.disk.total} total`)}`);
  }
  console.log();
}

function displayProjectInfo(info: ProjectInfo): void {
  console.log(chalk.white.bold('📦 Project Information:'));

  if (info.name) {
    console.log(`   Name: ${chalk.cyan(info.name)}`);
  }
  if (info.version) {
    console.log(`   Version: ${chalk.cyan(info.version)}`);
  }
  if (info.profile) {
    console.log(`   Claude Stack Profile: ${chalk.cyan(info.profile.toUpperCase())}`);
  }
  if (info.packageManager) {
    console.log(`   Package Manager: ${chalk.cyan(info.packageManager)}`);
  }
  if (info.dependencies !== undefined) {
    console.log(`   Dependencies: ${chalk.cyan(info.dependencies)}`);
  }
  if (info.devDependencies !== undefined) {
    console.log(`   Dev Dependencies: ${chalk.cyan(info.devDependencies)}`);
  }
  if (info.created) {
    console.log(`   Created: ${chalk.cyan(new Date(info.created).toLocaleDateString())}`);
  }
  if (info.lastUpdated) {
    console.log(`   Last Updated: ${chalk.cyan(new Date(info.lastUpdated).toLocaleDateString())}`);
  }

  if (!info.name && !info.version) {
    console.log(chalk.gray('   No project information available'));
  }

  console.log();
}

function displayClaudeStackInfo(info: ClaudeStackInfo): void {
  console.log(chalk.white.bold('🤖 Claude Stack Information:'));

  if (info.version) {
    console.log(`   CLI Version: ${chalk.cyan(info.version)}`);
  }

  const configStatus = info.configValid ? chalk.green('Valid') : chalk.red('Invalid');
  console.log(`   Configuration: ${configStatus}`);

  if (info.mcpServers !== undefined) {
    console.log(`   MCP Servers: ${chalk.cyan(info.mcpServers)}`);
  }

  if (info.hooks !== undefined) {
    console.log(`   Hooks: ${chalk.cyan(info.hooks)}`);
  }

  if (info.lastAudit) {
    console.log(`   Last Audit: ${chalk.cyan(info.lastAudit)}`);
  }

  if (info.lastUpgrade) {
    console.log(`   Last Upgrade: ${chalk.cyan(info.lastUpgrade)}`);
  }

  if (!info.configValid) {
    console.log(chalk.gray('   Run: claude-stack init'));
  }

  console.log();
}

function displayEnvironmentInfo(): void {
  console.log(chalk.white.bold('🌍 Environment:'));

  // Environment variables that might be relevant
  const relevantEnvVars = [
    'NODE_ENV',
    'CI',
    'GITHUB_ACTIONS',
    'GITLAB_CI',
    'TRAVIS',
    'CIRCLECI'
  ];

  const setVars = relevantEnvVars.filter(varName => process.env[varName]);

  if (setVars.length > 0) {
    setVars.forEach(varName => {
      console.log(`   ${varName}: ${chalk.cyan(process.env[varName])}`);
    });
  } else {
    console.log(chalk.gray('   No relevant environment variables set'));
  }

  // Check if in Git repository
  if (existsSync('.git')) {
    try {
      const branch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
      console.log(`   Git Branch: ${chalk.cyan(branch)}`);

      const isDirty = execSync('git status --porcelain', { encoding: 'utf8' }).trim().length > 0;
      const workingTreeStatus = isDirty ? chalk.yellow('Modified') : chalk.green('Clean');
      console.log(`   Working Tree: ${workingTreeStatus}`);
    } catch (error) {
      console.log(`   Git: ${chalk.gray('Available but unable to read status')}`);
    }
  } else {
    console.log(`   Git: ${chalk.gray('Not a Git repository')}`);
  }

  console.log();
}

function displayTroubleshootingInfo(): void {
  console.log(chalk.white.bold('🔧 Troubleshooting:'));

  const issues: string[] = [];
  const warnings: string[] = [];

  // Check Node.js version
  const nodeVersion = process.version.slice(1); // Remove 'v' prefix
  const majorVersion = parseInt(nodeVersion.split('.')[0]);
  if (majorVersion < 16) {
    issues.push('Node.js version is too old (requires 16+)');
  } else if (majorVersion < 18) {
    warnings.push('Node.js version is supported but consider upgrading to 18 LTS');
  }

  // Check if in Claude Stack project
  if (!existsSync('.claude-stack.yml')) {
    issues.push('Not a Claude Stack project - run: claude-stack init');
  }

  // Check package.json
  if (!existsSync('package.json')) {
    issues.push('No package.json found - run: npm init');
  }

  // Check for common problems
  if (existsSync('node_modules') && !existsSync('package-lock.json') && !existsSync('yarn.lock')) {
    warnings.push('No lock file found - consider running npm install');
  }

  // Display issues
  if (issues.length > 0) {
    console.log(chalk.red('   Issues:'));
    issues.forEach(issue => {
      console.log(`     • ${issue}`);
    });
  }

  if (warnings.length > 0) {
    console.log(chalk.yellow('   Warnings:'));
    warnings.forEach(warning => {
      console.log(`     • ${warning}`);
    });
  }

  if (issues.length === 0 && warnings.length === 0) {
    console.log(chalk.green('   No issues detected'));
  }

  console.log();

  // Useful commands
  console.log(chalk.white.bold('📚 Useful Commands:'));
  console.log(chalk.gray('   claude-stack status    '), chalk.white('- Check project health'));
  console.log(chalk.gray('   claude-stack audit     '), chalk.white('- Run security audit'));
  console.log(chalk.gray('   claude-stack doctor    '), chalk.white('- Diagnose issues'));
  console.log(chalk.gray('   claude-stack upgrade   '), chalk.white('- Check for updates'));
  console.log(chalk.gray('   claude-stack validate  '), chalk.white('- Validate configuration'));
}

function formatBytes(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(1)} ${units[unitIndex]}`;
}