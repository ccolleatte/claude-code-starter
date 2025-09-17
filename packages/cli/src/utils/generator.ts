import { writeFileSync, mkdirSync, existsSync, copyFileSync } from 'fs-extra';
import { join } from 'path';
import * as yaml from 'yaml';

export async function generateProjectStructure(config: any): Promise<void> {
  // Créer les répertoires essentiels
  createDirectories();

  // Générer .claude-stack.yml
  generateStackConfig(config);

  // Générer la configuration Claude Code
  generateClaudeConfig(config);

  // Générer package.json modifications
  await generatePackageJsonUpdates(config);

  // Générer les workflows GitHub
  if (config.setupCI) {
    generateGitHubWorkflows(config);
  }

  // Générer les configurations d'outils
  generateToolConfigurations(config);

  // Générer les fichiers de documentation
  generateDocumentation(config);
}

function createDirectories(): void {
  const directories = [
    '.claude',
    'tests',
    'docs',
    '.github/workflows',
    'scripts'
  ];

  directories.forEach(dir => {
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
  });
}

function generateStackConfig(config: any): void {
  const stackConfig = {
    name: config.projectName,
    profile: config.profile,
    version: '1.0.0',
    created: new Date().toISOString(),
    components: config.profileConfig.components,
    settings: {
      autoFix: true,
      notifications: {
        slack: false,
        email: false
      },
      ci: {
        enabled: config.setupCI,
        provider: 'github'
      }
    },
    customization: {}
  };

  writeFileSync('.claude-stack.yml', yaml.stringify(stackConfig));
}

function generateClaudeConfig(config: any): void {
  // MCP Configuration
  const mcpConfig = {
    mcpServers: {
      serena: {
        type: 'stdio',
        command: 'npx',
        args: ['serena'],
        env: {}
      }
    }
  };

  if (config.profile !== 'starter') {
    mcpConfig.mcpServers.cipher = {
      type: 'stdio',
      command: 'npx',
      args: ['@byterover/cipher', '--mode', 'mcp'],
      env: {
        CIPHER_WORKSPACE: '.'
      }
    };
  }

  writeFileSync('.claude/mcp.json', JSON.stringify(mcpConfig, null, 2));

  // Hooks Configuration
  const hooksConfig = {
    hooks: {
      PostToolUse: [
        {
          matcher: 'Edit|Write',
          hooks: [
            { type: 'command', command: 'npx prettier --write $CLAUDE_FILE_PATHS' }
          ]
        }
      ]
    }
  };

  if (config.profile !== 'starter') {
    hooksConfig.hooks.PostToolUse[0].hooks.push(
      { type: 'command', command: 'npx eslint --fix $CLAUDE_FILE_PATHS || true' }
    );
  }

  writeFileSync('.claude/hooks.json', JSON.stringify(hooksConfig, null, 2));
}

async function generatePackageJsonUpdates(config: any): Promise<void> {
  const packageJsonPath = 'package.json';
  let packageJson: any;

  if (existsSync(packageJsonPath)) {
    packageJson = JSON.parse(require('fs').readFileSync(packageJsonPath, 'utf8'));
  } else {
    packageJson = {
      name: config.projectName,
      version: '1.0.0',
      description: '',
      main: 'index.js',
      scripts: {},
      dependencies: {},
      devDependencies: {}
    };
  }

  // Ajouter les scripts essentiels
  packageJson.scripts = {
    ...packageJson.scripts,
    test: 'jest',
    'test:watch': 'jest --watch',
    'test:coverage': 'jest --coverage',
    lint: 'eslint .',
    'lint:fix': 'eslint . --fix',
    format: 'prettier --write .',
    'claude-audit': 'claude-stack audit',
    'claude-upgrade': 'claude-stack upgrade --dry-run'
  };

  // Ajouter les scripts spécifiques au profil
  if (config.profile === 'standard' || config.profile === 'enterprise') {
    packageJson.scripts.security = 'semgrep --config=auto .';
    packageJson.scripts['security:secrets'] = 'gitleaks detect';
  }

  if (config.profile === 'enterprise') {
    packageJson.scripts['security:sca'] = 'syft packages . && grype .';
    packageJson.scripts['security:container'] = 'trivy fs .';
  }

  writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
}

function generateGitHubWorkflows(config: any): void {
  // Workflow de base pour les tests
  const testWorkflow = {
    name: 'Tests',
    on: ['push', 'pull_request'],
    jobs: {
      test: {
        'runs-on': 'ubuntu-latest',
        steps: [
          { uses: 'actions/checkout@v4' },
          {
            uses: 'actions/setup-node@v4',
            with: { 'node-version': '20' }
          },
          { run: 'npm ci' },
          { run: 'npm test' },
          { run: 'npm run lint' }
        ]
      }
    }
  };

  writeFileSync('.github/workflows/test.yml', yaml.stringify(testWorkflow));

  // Workflow de sécurité pour profiles standard/enterprise
  if (config.profile === 'standard' || config.profile === 'enterprise') {
    const securityWorkflow = {
      name: 'Security',
      on: ['push', 'pull_request'],
      jobs: {
        security: {
          'runs-on': 'ubuntu-latest',
          steps: [
            { uses: 'actions/checkout@v4' },
            {
              uses: 'actions/setup-node@v4',
              with: { 'node-version': '20' }
            },
            { run: 'npm ci' },
            { run: 'npm audit' },
            { run: 'npx semgrep --config=auto .' }
          ]
        }
      }
    };

    writeFileSync('.github/workflows/security.yml', yaml.stringify(securityWorkflow));
  }

  // Workflow Claude Stack maintenance
  const maintenanceWorkflow = {
    name: 'Claude Stack Maintenance',
    on: {
      schedule: [{ cron: '0 2 * * 1' }], // Weekly on Monday
      workflow_dispatch: {}
    },
    jobs: {
      maintenance: {
        'runs-on': 'ubuntu-latest',
        steps: [
          { uses: 'actions/checkout@v4' },
          {
            uses: 'actions/setup-node@v4',
            with: { 'node-version': '20' }
          },
          { run: 'npm ci' },
          { run: 'npx claude-stack audit' },
          { run: 'npx claude-stack upgrade --dry-run' }
        ]
      }
    }
  };

  writeFileSync('.github/workflows/claude-stack.yml', yaml.stringify(maintenanceWorkflow));
}

function generateToolConfigurations(config: any): void {
  // ESLint configuration
  const eslintConfig = {
    extends: ['eslint:recommended'],
    env: {
      node: true,
      es2021: true
    },
    parserOptions: {
      ecmaVersion: 12,
      sourceType: 'module'
    },
    rules: {
      'no-console': 'warn',
      'no-unused-vars': 'error'
    }
  };

  if (config.profileConfig.components.quality?.tools.includes('eslint')) {
    writeFileSync('.eslintrc.json', JSON.stringify(eslintConfig, null, 2));
  }

  // Prettier configuration
  const prettierConfig = {
    semi: true,
    singleQuote: true,
    tabWidth: 2,
    trailingComma: 'es5',
    printWidth: 100
  };

  if (config.profileConfig.components.quality?.tools.includes('prettier')) {
    writeFileSync('.prettierrc.json', JSON.stringify(prettierConfig, null, 2));
  }

  // Jest configuration
  if (config.profileConfig.components.testing?.tools.includes('jest')) {
    const jestConfig = {
      testEnvironment: 'node',
      collectCoverageFrom: [
        'src/**/*.{js,ts}',
        '!src/**/*.d.ts'
      ],
      coverageThreshold: {
        global: {
          branches: config.profileConfig.components.testing.configuration.branch_coverage || 70,
          functions: 80,
          lines: config.profileConfig.components.testing.configuration.coverage_threshold || 80,
          statements: 80
        }
      },
      testMatch: [
        '**/__tests__/**/*.{js,ts}',
        '**/?(*.)+(spec|test).{js,ts}'
      ]
    };

    writeFileSync('jest.config.json', JSON.stringify(jestConfig, null, 2));
  }

  // .gitignore
  const gitignoreContent = `
node_modules/
dist/
build/
coverage/
.env
.env.local
.env.development.local
.env.test.local
.env.production.local
*.log
.DS_Store
.vscode/settings.json
.idea/
`;

  if (!existsSync('.gitignore')) {
    writeFileSync('.gitignore', gitignoreContent.trim());
  }
}

function generateDocumentation(config: any): void {
  // README.md
  const readmeContent = `# ${config.projectName}

## Claude Stack Configuration

This project is configured with Claude Stack using the **${config.profile}** profile.

### Available Scripts

- \`npm test\` - Run tests
- \`npm run lint\` - Run linting
- \`npm run format\` - Format code
- \`npm run claude-audit\` - Run Claude Stack audit
- \`npm run claude-upgrade\` - Check for Claude Stack updates

### Profile: ${config.profile.toUpperCase()}

${getProfileDescription(config.profile)}

### Getting Started

1. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

2. Run tests:
   \`\`\`bash
   npm test
   \`\`\`

3. Run security audit:
   \`\`\`bash
   claude-stack audit
   \`\`\`

### Claude Stack Commands

- \`claude-stack status\` - Check project status
- \`claude-stack audit --fix\` - Audit and fix issues
- \`claude-stack upgrade\` - Upgrade components
- \`claude-stack doctor\` - Diagnose issues

For more information, visit [Claude Stack Documentation](https://docs.anthropic.com/claude-stack).
`;

  writeFileSync('README.md', readmeContent);

  // SECURITY.md (for standard/enterprise profiles)
  if (config.profile === 'standard' || config.profile === 'enterprise') {
    const securityContent = `# Security Policy

## Supported Versions

We actively maintain security for the latest version of this project.

## Reporting a Vulnerability

If you discover a security vulnerability, please send an email to security@yourcompany.com.

## Security Measures

This project uses Claude Stack with the ${config.profile} profile, which includes:

${config.profile === 'standard' ? `
- SAST scanning with Semgrep
- Secret detection with Gitleaks
- Dependency vulnerability scanning
- Automated security updates
` : `
- Comprehensive SAST scanning
- Secret detection and prevention
- Software composition analysis
- Container security scanning
- Policy as code enforcement
- Compliance monitoring
`}

## Automated Security

Security scans are automatically run on:
- Every pull request
- Every push to main branch
- Weekly scheduled scans

View security reports in the GitHub Security tab.
`;

    writeFileSync('SECURITY.md', securityContent);
  }
}

function getProfileDescription(profile: string): string {
  switch (profile) {
    case 'starter':
      return 'Essential tools for testing and code quality. Perfect for getting started with security best practices.';
    case 'standard':
      return 'Comprehensive security setup with SAST, secret detection, and dependency scanning. Recommended for most projects.';
    case 'enterprise':
      return 'Full security stack with governance, compliance, and advanced monitoring. Suitable for enterprise environments.';
    default:
      return 'Custom Claude Stack configuration.';
  }
}