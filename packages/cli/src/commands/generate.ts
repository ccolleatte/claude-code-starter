import chalk from 'chalk';
import inquirer from 'inquirer';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs-extra';
import * as yaml from 'yaml';
import * as path from 'path';

import { GenerateOptions } from '../types';

interface Template {
  name: string;
  description: string;
  type: string;
  content: string;
  variables?: { [key: string]: any };
}

export async function generateCommand(options: GenerateOptions): Promise<void> {
  const { type, template, output } = options;

  console.log(chalk.blue.bold('🏗️  Claude Stack Generator'));
  console.log();

  try {
    switch (type) {
      case 'workflow':
        await generateWorkflow(template, output);
        break;
      case 'hook':
        await generateHook(template, output);
        break;
      case 'config':
        await generateConfig(template, output);
        break;
      case 'docker':
        await generateDocker(template, output);
        break;
      case 'docs':
        await generateDocs(template, output);
        break;
      default:
        await handleInteractiveGenerate();
        break;
    }
  } catch (error) {
    console.error(chalk.red('Generation failed:'), error.message);
    process.exit(1);
  }
}

async function generateWorkflow(templateName?: string, outputPath?: string): Promise<void> {
  const workflows = getWorkflowTemplates();

  if (!templateName) {
    const { selected } = await inquirer.prompt([{
      type: 'list',
      name: 'selected',
      message: 'Select a workflow template:',
      choices: workflows.map(w => ({
        name: `${w.name} - ${w.description}`,
        value: w.name
      }))
    }]);
    templateName = selected;
  }

  const template = workflows.find(w => w.name === templateName);
  if (!template) {
    console.log(chalk.red(`Workflow template '${templateName}' not found`));
    return;
  }

  if (!outputPath) {
    const { path } = await inquirer.prompt([{
      type: 'input',
      name: 'path',
      message: 'Output path:',
      default: `.github/workflows/${template.name}.yml`
    }]);
    outputPath = path;
  }

  // Collecter les variables nécessaires
  const variables = await collectTemplateVariables(template);

  // Générer le contenu
  const content = processTemplate(template.content, variables);

  // Créer le répertoire si nécessaire
  const dir = path.dirname(outputPath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  // Écrire le fichier
  writeFileSync(outputPath, content);

  console.log(chalk.green(`✅ Generated workflow: ${outputPath}`));
}

async function generateHook(templateName?: string, outputPath?: string): Promise<void> {
  const hooks = getHookTemplates();

  if (!templateName) {
    const { selected } = await inquirer.prompt([{
      type: 'list',
      name: 'selected',
      message: 'Select a hook template:',
      choices: hooks.map(h => ({
        name: `${h.name} - ${h.description}`,
        value: h.name
      }))
    }]);
    templateName = selected;
  }

  const template = hooks.find(h => h.name === templateName);
  if (!template) {
    console.log(chalk.red(`Hook template '${templateName}' not found`));
    return;
  }

  if (!outputPath) {
    const { path } = await inquirer.prompt([{
      type: 'input',
      name: 'path',
      message: 'Output path:',
      default: `.claude/hooks.json`
    }]);
    outputPath = path;
  }

  // Collecter les variables
  const variables = await collectTemplateVariables(template);

  // Traiter le template
  const content = processTemplate(template.content, variables);

  // Si le fichier existe déjà, merger avec la configuration existante
  let finalContent = content;
  if (existsSync(outputPath)) {
    const { merge } = await inquirer.prompt([{
      type: 'confirm',
      name: 'merge',
      message: 'Hook configuration exists. Merge with existing?',
      default: true
    }]);

    if (merge) {
      try {
        const existingConfig = JSON.parse(readFileSync(outputPath, 'utf8'));
        const newConfig = JSON.parse(content);

        // Merger les hooks
        if (existingConfig.hooks && newConfig.hooks) {
          Object.keys(newConfig.hooks).forEach(hookType => {
            if (!existingConfig.hooks[hookType]) {
              existingConfig.hooks[hookType] = [];
            }
            existingConfig.hooks[hookType].push(...newConfig.hooks[hookType]);
          });
        }

        finalContent = JSON.stringify(existingConfig, null, 2);
      } catch (error) {
        console.log(chalk.yellow('Warning: Could not merge configurations, overwriting'));
      }
    }
  }

  // Créer le répertoire si nécessaire
  const dir = path.dirname(outputPath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  writeFileSync(outputPath, finalContent);

  console.log(chalk.green(`✅ Generated hook configuration: ${outputPath}`));
}

async function generateConfig(templateName?: string, outputPath?: string): Promise<void> {
  const configs = getConfigTemplates();

  if (!templateName) {
    const { selected } = await inquirer.prompt([{
      type: 'list',
      name: 'selected',
      message: 'Select a configuration template:',
      choices: configs.map(c => ({
        name: `${c.name} - ${c.description}`,
        value: c.name
      }))
    }]);
    templateName = selected;
  }

  const template = configs.find(c => c.name === templateName);
  if (!template) {
    console.log(chalk.red(`Configuration template '${templateName}' not found`));
    return;
  }

  if (!outputPath) {
    const extension = template.name.includes('json') ? '.json' :
                     template.name.includes('yaml') ? '.yml' : '.conf';
    const { path } = await inquirer.prompt([{
      type: 'input',
      name: 'path',
      message: 'Output path:',
      default: `.${template.name}${extension}`
    }]);
    outputPath = path;
  }

  // Collecter les variables
  const variables = await collectTemplateVariables(template);

  // Générer le contenu
  const content = processTemplate(template.content, variables);

  writeFileSync(outputPath, content);

  console.log(chalk.green(`✅ Generated configuration: ${outputPath}`));
}

async function generateDocker(templateName?: string, outputPath?: string): Promise<void> {
  const dockerTemplates = getDockerTemplates();

  if (!templateName) {
    const { selected } = await inquirer.prompt([{
      type: 'list',
      name: 'selected',
      message: 'Select a Docker template:',
      choices: dockerTemplates.map(d => ({
        name: `${d.name} - ${d.description}`,
        value: d.name
      }))
    }]);
    templateName = selected;
  }

  const template = dockerTemplates.find(d => d.name === templateName);
  if (!template) {
    console.log(chalk.red(`Docker template '${templateName}' not found`));
    return;
  }

  if (!outputPath) {
    const { path } = await inquirer.prompt([{
      type: 'input',
      name: 'path',
      message: 'Output path:',
      default: template.name === 'dockerfile' ? 'Dockerfile' : 'docker-compose.yml'
    }]);
    outputPath = path;
  }

  // Collecter les variables
  const variables = await collectTemplateVariables(template);

  // Générer le contenu
  const content = processTemplate(template.content, variables);

  writeFileSync(outputPath, content);

  console.log(chalk.green(`✅ Generated Docker file: ${outputPath}`));
}

async function generateDocs(templateName?: string, outputPath?: string): Promise<void> {
  const docTemplates = getDocumentationTemplates();

  if (!templateName) {
    const { selected } = await inquirer.prompt([{
      type: 'list',
      name: 'selected',
      message: 'Select a documentation template:',
      choices: docTemplates.map(d => ({
        name: `${d.name} - ${d.description}`,
        value: d.name
      }))
    }]);
    templateName = selected;
  }

  const template = docTemplates.find(d => d.name === templateName);
  if (!template) {
    console.log(chalk.red(`Documentation template '${templateName}' not found`));
    return;
  }

  if (!outputPath) {
    const { path } = await inquirer.prompt([{
      type: 'input',
      name: 'path',
      message: 'Output path:',
      default: `docs/${template.name}.md`
    }]);
    outputPath = path;
  }

  // Collecter les variables
  const variables = await collectTemplateVariables(template);

  // Générer le contenu
  const content = processTemplate(template.content, variables);

  // Créer le répertoire si nécessaire
  const dir = path.dirname(outputPath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  writeFileSync(outputPath, content);

  console.log(chalk.green(`✅ Generated documentation: ${outputPath}`));
}

async function handleInteractiveGenerate(): Promise<void> {
  const types = [
    { name: 'GitHub Workflow', value: 'workflow' },
    { name: 'Claude Code Hook', value: 'hook' },
    { name: 'Configuration File', value: 'config' },
    { name: 'Docker Files', value: 'docker' },
    { name: 'Documentation', value: 'docs' }
  ];

  const { type } = await inquirer.prompt([{
    type: 'list',
    name: 'type',
    message: 'What would you like to generate?',
    choices: types
  }]);

  switch (type) {
    case 'workflow':
      await generateWorkflow();
      break;
    case 'hook':
      await generateHook();
      break;
    case 'config':
      await generateConfig();
      break;
    case 'docker':
      await generateDocker();
      break;
    case 'docs':
      await generateDocs();
      break;
  }
}

async function collectTemplateVariables(template: Template): Promise<{ [key: string]: any }> {
  const variables: { [key: string]: any } = {};

  if (!template.variables) {
    return variables;
  }

  console.log(chalk.white('📝 Template requires the following information:'));

  for (const [key, config] of Object.entries(template.variables)) {
    const question: any = {
      type: config.type || 'input',
      name: key,
      message: config.description || `Enter ${key}:`
    };

    if (config.default !== undefined) {
      question.default = config.default;
    }

    if (config.choices) {
      question.type = 'list';
      question.choices = config.choices;
    }

    if (config.validate) {
      question.validate = config.validate;
    }

    const answer = await inquirer.prompt([question]);
    variables[key] = answer[key];
  }

  return variables;
}

function processTemplate(content: string, variables: { [key: string]: any }): string {
  let processed = content;

  // Remplacer les variables {{variable}}
  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
    processed = processed.replace(regex, String(value));
  });

  // Remplacer les variables système
  const now = new Date();
  processed = processed.replace(/{{DATE}}/g, now.toISOString().split('T')[0]);
  processed = processed.replace(/{{YEAR}}/g, now.getFullYear().toString());

  // Ajouter les informations du projet si disponible
  if (existsSync('.claude-stack.yml')) {
    const config = yaml.parse(readFileSync('.claude-stack.yml', 'utf8'));
    processed = processed.replace(/{{PROJECT_NAME}}/g, config.name || 'Unknown');
    processed = processed.replace(/{{PROFILE}}/g, config.profile || 'starter');
  }

  return processed;
}

function getWorkflowTemplates(): Template[] {
  return [
    {
      name: 'ci-basic',
      description: 'Basic CI workflow with tests and linting',
      type: 'workflow',
      content: `name: CI
on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '{{NODE_VERSION}}'
          cache: 'npm'
      - run: npm ci
      - run: npm run lint
      - run: npm test
      - run: npm run build`,
      variables: {
        NODE_VERSION: {
          type: 'list',
          description: 'Node.js version',
          choices: ['18', '20', '21'],
          default: '20'
        }
      }
    },
    {
      name: 'security-scan',
      description: 'Security scanning workflow',
      type: 'workflow',
      content: `name: Security Scan
on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]
  schedule:
    - cron: '0 2 * * 1'

jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm audit
      - run: npx semgrep --config=auto .
      - uses: securecodewarrior/github-action-add-sarif@v1
        if: always()
        with:
          sarif-file: semgrep.sarif`,
      variables: {}
    },
    {
      name: 'deploy-production',
      description: 'Production deployment workflow',
      type: 'workflow',
      content: `name: Deploy to Production
on:
  push:
    tags:
      - 'v*'

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: production
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run build
      - run: npm test
      - name: Deploy to {{PLATFORM}}
        run: |
          echo "Deploying to {{PLATFORM}}"
          # Add your deployment commands here`,
      variables: {
        PLATFORM: {
          type: 'list',
          description: 'Deployment platform',
          choices: ['AWS', 'Azure', 'GCP', 'Heroku', 'Vercel', 'Netlify'],
          default: 'Vercel'
        }
      }
    }
  ];
}

function getHookTemplates(): Template[] {
  return [
    {
      name: 'auto-format',
      description: 'Auto-format code on file changes',
      type: 'hook',
      content: `{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "npx prettier --write $CLAUDE_FILE_PATHS"
          },
          {
            "type": "command",
            "command": "npx eslint --fix $CLAUDE_FILE_PATHS || true"
          }
        ]
      }
    ]
  }
}`,
      variables: {}
    },
    {
      name: 'security-check',
      description: 'Run security checks on code changes',
      type: 'hook',
      content: `{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "npx semgrep --config=auto $CLAUDE_FILE_PATHS"
          }
        ]
      }
    ]
  }
}`,
      variables: {}
    },
    {
      name: 'test-runner',
      description: 'Run tests when code changes',
      type: 'hook',
      content: `{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "{{TEST_COMMAND}}"
          }
        ]
      }
    ]
  }
}`,
      variables: {
        TEST_COMMAND: {
          type: 'input',
          description: 'Test command to run',
          default: 'npm test'
        }
      }
    }
  ];
}

function getConfigTemplates(): Template[] {
  return [
    {
      name: 'eslintrc',
      description: 'ESLint configuration',
      type: 'config',
      content: `{
  "extends": ["eslint:recommended"],
  "env": {
    "node": true,
    "es2021": true
  },
  "parserOptions": {
    "ecmaVersion": 12,
    "sourceType": "module"
  },
  "rules": {
    "no-console": "{{CONSOLE_RULE}}",
    "no-unused-vars": "error",
    "prefer-const": "error",
    "no-var": "error"
  }
}`,
      variables: {
        CONSOLE_RULE: {
          type: 'list',
          description: 'Console.log rule',
          choices: ['warn', 'error', 'off'],
          default: 'warn'
        }
      }
    },
    {
      name: 'prettierrc',
      description: 'Prettier configuration',
      type: 'config',
      content: `{
  "semi": {{SEMICOLONS}},
  "singleQuote": {{SINGLE_QUOTES}},
  "tabWidth": {{TAB_WIDTH}},
  "trailingComma": "{{TRAILING_COMMA}}",
  "printWidth": {{PRINT_WIDTH}}
}`,
      variables: {
        SEMICOLONS: {
          type: 'confirm',
          description: 'Use semicolons?',
          default: true
        },
        SINGLE_QUOTES: {
          type: 'confirm',
          description: 'Use single quotes?',
          default: true
        },
        TAB_WIDTH: {
          type: 'input',
          description: 'Tab width',
          default: '2',
          validate: (input: string) => !isNaN(Number(input)) || 'Please enter a number'
        },
        TRAILING_COMMA: {
          type: 'list',
          description: 'Trailing commas',
          choices: ['none', 'es5', 'all'],
          default: 'es5'
        },
        PRINT_WIDTH: {
          type: 'input',
          description: 'Print width',
          default: '100',
          validate: (input: string) => !isNaN(Number(input)) || 'Please enter a number'
        }
      }
    }
  ];
}

function getDockerTemplates(): Template[] {
  return [
    {
      name: 'dockerfile',
      description: 'Node.js Dockerfile',
      type: 'docker',
      content: `FROM node:{{NODE_VERSION}}-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE {{PORT}}

USER node

CMD ["npm", "start"]`,
      variables: {
        NODE_VERSION: {
          type: 'list',
          description: 'Node.js version',
          choices: ['18', '20', '21'],
          default: '20'
        },
        PORT: {
          type: 'input',
          description: 'Application port',
          default: '3000'
        }
      }
    },
    {
      name: 'docker-compose',
      description: 'Docker Compose configuration',
      type: 'docker',
      content: `version: '3.8'

services:
  app:
    build: .
    ports:
      - "{{PORT}}:{{PORT}}"
    environment:
      - NODE_ENV=production
    depends_on:
      - db

  db:
    image: {{DATABASE}}
    environment:
      - POSTGRES_DB={{DB_NAME}}
      - POSTGRES_USER={{DB_USER}}
      - POSTGRES_PASSWORD={{DB_PASSWORD}}
    ports:
      - "5432:5432"
    volumes:
      - db_data:/var/lib/postgresql/data

volumes:
  db_data:`,
      variables: {
        PORT: {
          type: 'input',
          description: 'Application port',
          default: '3000'
        },
        DATABASE: {
          type: 'list',
          description: 'Database type',
          choices: ['postgres:15', 'mysql:8', 'redis:7'],
          default: 'postgres:15'
        },
        DB_NAME: {
          type: 'input',
          description: 'Database name',
          default: 'myapp'
        },
        DB_USER: {
          type: 'input',
          description: 'Database user',
          default: 'user'
        },
        DB_PASSWORD: {
          type: 'input',
          description: 'Database password',
          default: 'password'
        }
      }
    }
  ];
}

function getDocumentationTemplates(): Template[] {
  return [
    {
      name: 'api-documentation',
      description: 'API documentation template',
      type: 'docs',
      content: `# {{PROJECT_NAME}} API Documentation

## Overview

This document describes the API endpoints for {{PROJECT_NAME}}.

## Base URL

\`\`\`
{{BASE_URL}}
\`\`\`

## Authentication

{{AUTH_DESCRIPTION}}

## Endpoints

### GET /api/health

Health check endpoint.

**Response:**
\`\`\`json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00Z"
}
\`\`\`

## Error Handling

All errors follow the standard HTTP status codes:

- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Internal Server Error

## Rate Limiting

API requests are limited to {{RATE_LIMIT}} requests per minute.`,
      variables: {
        BASE_URL: {
          type: 'input',
          description: 'API base URL',
          default: 'https://api.example.com'
        },
        AUTH_DESCRIPTION: {
          type: 'input',
          description: 'Authentication description',
          default: 'This API uses Bearer token authentication.'
        },
        RATE_LIMIT: {
          type: 'input',
          description: 'Rate limit (requests per minute)',
          default: '100'
        }
      }
    },
    {
      name: 'contributing',
      description: 'Contributing guidelines',
      type: 'docs',
      content: `# Contributing to {{PROJECT_NAME}}

Thank you for your interest in contributing to {{PROJECT_NAME}}!

## Development Setup

1. Fork the repository
2. Clone your fork: \`git clone https://github.com/YOUR_USERNAME/{{PROJECT_NAME}}.git\`
3. Install dependencies: \`npm install\`
4. Create a branch: \`git checkout -b feature/your-feature\`

## Code Style

We use the following tools to maintain code quality:

- ESLint for code linting
- Prettier for code formatting
- {{TEST_FRAMEWORK}} for testing

Run the following commands before submitting:

\`\`\`bash
npm run lint
npm test
npm run build
\`\`\`

## Submitting Changes

1. Ensure all tests pass
2. Update documentation if needed
3. Submit a pull request
4. Wait for review

## Code of Conduct

Please be respectful and professional in all interactions.`,
      variables: {
        TEST_FRAMEWORK: {
          type: 'list',
          description: 'Testing framework',
          choices: ['Jest', 'Mocha', 'Vitest'],
          default: 'Jest'
        }
      }
    }
  ];
}