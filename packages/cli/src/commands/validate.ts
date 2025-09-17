import chalk from 'chalk';
import { existsSync, readFileSync } from 'fs-extra';
import * as yaml from 'yaml';
import * as path from 'path';

import { ValidateOptions, ValidationResult, ValidationError } from '../types';
import { getProfile } from '../profiles';

export async function validateCommand(options: ValidateOptions): Promise<void> {
  console.log(chalk.blue.bold('✅ Claude Stack Validator'));
  console.log();

  try {
    const results = await runValidation(options);
    displayValidationResults(results);

    const summary = generateValidationSummary(results);
    displayValidationSummary(summary);

    // Exit avec le bon code selon les résultats
    if (summary.errors > 0) {
      process.exit(1);
    } else if (summary.warnings > 0 && options.strict) {
      process.exit(1);
    }

  } catch (error) {
    console.error(chalk.red('Validation failed:'), error.message);
    process.exit(1);
  }
}

async function runValidation(options: ValidateOptions): Promise<ValidationResult[]> {
  const results: ValidationResult[] = [];

  // Validation de la configuration principale
  results.push(await validateMainConfiguration(options));

  // Validation de la configuration Claude
  results.push(await validateClaudeConfiguration(options));

  // Validation des dépendances
  results.push(await validateDependencies(options));

  // Validation des workflows GitHub
  results.push(await validateGitHubWorkflows(options));

  // Validation des configurations d'outils
  results.push(await validateToolConfigurations(options));

  // Validation de la structure de projet
  results.push(await validateProjectStructure(options));

  return results;
}

async function validateMainConfiguration(options: ValidateOptions): Promise<ValidationResult> {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  const configPath = '.claude-stack.yml';

  if (!existsSync(configPath)) {
    errors.push({
      severity: 'error',
      message: 'Claude Stack configuration file not found',
      file: configPath,
      fix: 'Run: claude-stack init'
    });

    return {
      component: 'Main Configuration',
      valid: false,
      errors,
      warnings
    };
  }

  try {
    const content = readFileSync(configPath, 'utf8');
    const config = yaml.parse(content);

    // Valider la structure YAML
    if (!config) {
      errors.push({
        severity: 'error',
        message: 'Configuration file is empty or invalid',
        file: configPath,
        fix: 'Check YAML syntax'
      });
      return { component: 'Main Configuration', valid: false, errors, warnings };
    }

    // Valider les champs requis
    const requiredFields = ['name', 'profile', 'version'];
    requiredFields.forEach(field => {
      if (!config[field]) {
        errors.push({
          severity: 'error',
          message: `Missing required field: ${field}`,
          file: configPath,
          line: 1,
          fix: `Add ${field} field to configuration`
        });
      }
    });

    // Valider le profil
    const validProfiles = ['starter', 'standard', 'enterprise'];
    if (config.profile && !validProfiles.includes(config.profile)) {
      errors.push({
        severity: 'error',
        message: `Invalid profile: ${config.profile}`,
        file: configPath,
        fix: `Use one of: ${validProfiles.join(', ')}`
      });
    }

    // Valider la version
    if (config.version && !/^\d+\.\d+\.\d+$/.test(config.version)) {
      warnings.push({
        severity: 'warning',
        message: 'Version should follow semantic versioning (x.y.z)',
        file: configPath,
        fix: 'Update version to semantic format'
      });
    }

    // Valider la cohérence avec le profil
    if (config.profile && config.components) {
      const profileConfig = getProfile(config.profile);
      if (profileConfig) {
        Object.keys(config.components).forEach(component => {
          if (!profileConfig.components[component]) {
            warnings.push({
              severity: 'warning',
              message: `Component '${component}' not expected in ${config.profile} profile`,
              file: configPath,
              fix: 'Remove component or change profile'
            });
          }
        });
      }
    }

    // Valider les dates
    if (config.created && isNaN(Date.parse(config.created))) {
      warnings.push({
        severity: 'warning',
        message: 'Invalid created date format',
        file: configPath,
        fix: 'Use ISO 8601 date format'
      });
    }

  } catch (error) {
    errors.push({
      severity: 'error',
      message: `YAML parsing error: ${error.message}`,
      file: configPath,
      fix: 'Fix YAML syntax errors'
    });
  }

  return {
    component: 'Main Configuration',
    valid: errors.length === 0,
    errors,
    warnings
  };
}

async function validateClaudeConfiguration(options: ValidateOptions): Promise<ValidationResult> {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  // Vérifier la présence du répertoire .claude
  if (!existsSync('.claude')) {
    errors.push({
      severity: 'error',
      message: 'Claude configuration directory not found',
      file: '.claude/',
      fix: 'Run: claude-stack init --force'
    });

    return {
      component: 'Claude Configuration',
      valid: false,
      errors,
      warnings
    };
  }

  // Valider mcp.json
  const mcpPath = '.claude/mcp.json';
  if (existsSync(mcpPath)) {
    try {
      const mcpConfig = JSON.parse(readFileSync(mcpPath, 'utf8'));

      if (!mcpConfig.mcpServers) {
        warnings.push({
          severity: 'warning',
          message: 'No MCP servers configured',
          file: mcpPath,
          fix: 'Add MCP server configurations'
        });
      } else {
        // Valider la structure des serveurs MCP
        Object.entries(mcpConfig.mcpServers).forEach(([name, config]: [string, any]) => {
          if (!config.command && !config.type) {
            errors.push({
              severity: 'error',
              message: `MCP server '${name}' missing command or type`,
              file: mcpPath,
              fix: 'Add command and type for MCP server'
            });
          }
        });
      }
    } catch (error) {
      errors.push({
        severity: 'error',
        message: `Invalid MCP configuration JSON: ${error.message}`,
        file: mcpPath,
        fix: 'Fix JSON syntax in MCP configuration'
      });
    }
  } else {
    warnings.push({
      severity: 'warning',
      message: 'MCP configuration not found',
      file: mcpPath,
      fix: 'Generate MCP configuration'
    });
  }

  // Valider hooks.json
  const hooksPath = '.claude/hooks.json';
  if (existsSync(hooksPath)) {
    try {
      const hooksConfig = JSON.parse(readFileSync(hooksPath, 'utf8'));

      if (hooksConfig.hooks) {
        Object.entries(hooksConfig.hooks).forEach(([hookType, hooks]: [string, any]) => {
          if (!Array.isArray(hooks)) {
            errors.push({
              severity: 'error',
              message: `Hook type '${hookType}' should be an array`,
              file: hooksPath,
              fix: 'Ensure hook configurations are arrays'
            });
          }
        });
      }
    } catch (error) {
      errors.push({
        severity: 'error',
        message: `Invalid hooks configuration JSON: ${error.message}`,
        file: hooksPath,
        fix: 'Fix JSON syntax in hooks configuration'
      });
    }
  }

  return {
    component: 'Claude Configuration',
    valid: errors.length === 0,
    errors,
    warnings
  };
}

async function validateDependencies(options: ValidateOptions): Promise<ValidationResult> {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  // Valider package.json
  const packageJsonPath = 'package.json';
  if (!existsSync(packageJsonPath)) {
    errors.push({
      severity: 'error',
      message: 'package.json not found',
      file: packageJsonPath,
      fix: 'Initialize Node.js project: npm init'
    });

    return {
      component: 'Dependencies',
      valid: false,
      errors,
      warnings
    };
  }

  try {
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));

    // Valider les champs essentiels
    if (!packageJson.name) {
      errors.push({
        severity: 'error',
        message: 'Package name is required',
        file: packageJsonPath,
        fix: 'Add name field to package.json'
      });
    }

    if (!packageJson.version) {
      errors.push({
        severity: 'error',
        message: 'Package version is required',
        file: packageJsonPath,
        fix: 'Add version field to package.json'
      });
    }

    // Vérifier les scripts essentiels
    const requiredScripts = ['test', 'lint'];
    requiredScripts.forEach(script => {
      if (!packageJson.scripts?.[script]) {
        warnings.push({
          severity: 'warning',
          message: `Missing script: ${script}`,
          file: packageJsonPath,
          fix: `Add ${script} script to package.json`
        });
      }
    });

    // Vérifier la cohérence des versions
    const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
    Object.entries(dependencies).forEach(([name, version]: [string, any]) => {
      if (typeof version !== 'string') {
        errors.push({
          severity: 'error',
          message: `Invalid version for ${name}: ${version}`,
          file: packageJsonPath,
          fix: 'Use valid semantic version'
        });
      }
    });

  } catch (error) {
    errors.push({
      severity: 'error',
      message: `Invalid package.json: ${error.message}`,
      file: packageJsonPath,
      fix: 'Fix JSON syntax in package.json'
    });
  }

  // Vérifier package-lock.json
  if (!existsSync('package-lock.json') && !existsSync('yarn.lock')) {
    warnings.push({
      severity: 'warning',
      message: 'No lock file found',
      file: 'package-lock.json',
      fix: 'Run npm install to generate lock file'
    });
  }

  return {
    component: 'Dependencies',
    valid: errors.length === 0,
    errors,
    warnings
  };
}

async function validateGitHubWorkflows(options: ValidateOptions): Promise<ValidationResult> {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  const workflowsDir = '.github/workflows';

  if (!existsSync(workflowsDir)) {
    warnings.push({
      severity: 'warning',
      message: 'No GitHub workflows found',
      file: workflowsDir,
      fix: 'Add CI/CD workflows for automation'
    });

    return {
      component: 'GitHub Workflows',
      valid: true,
      errors,
      warnings
    };
  }

  // Valider les fichiers de workflow
  const fs = require('fs');
  const files = fs.readdirSync(workflowsDir).filter((f: string) =>
    f.endsWith('.yml') || f.endsWith('.yaml')
  );

  if (files.length === 0) {
    warnings.push({
      severity: 'warning',
      message: 'No workflow files found in .github/workflows',
      file: workflowsDir,
      fix: 'Add workflow files (.yml or .yaml)'
    });
  }

  files.forEach((file: string) => {
    const filePath = path.join(workflowsDir, file);
    try {
      const content = readFileSync(filePath, 'utf8');
      const workflow = yaml.parse(content);

      // Valider la structure de base
      if (!workflow.name) {
        warnings.push({
          severity: 'warning',
          message: 'Workflow missing name',
          file: filePath,
          fix: 'Add name field to workflow'
        });
      }

      if (!workflow.on) {
        errors.push({
          severity: 'error',
          message: 'Workflow missing trigger events',
          file: filePath,
          fix: 'Add on field with trigger events'
        });
      }

      if (!workflow.jobs) {
        errors.push({
          severity: 'error',
          message: 'Workflow missing jobs',
          file: filePath,
          fix: 'Add jobs field with at least one job'
        });
      }

      // Vérifier les versions des actions
      const content_str = content.toString();
      const actionMatches = content_str.match(/uses:\s*([^@\s]+)@([^\s]+)/g);
      if (actionMatches) {
        actionMatches.forEach(match => {
          if (match.includes('@master') || match.includes('@main')) {
            warnings.push({
              severity: 'warning',
              message: `Action using branch reference: ${match}`,
              file: filePath,
              fix: 'Use specific version tags for actions'
            });
          }
        });
      }

    } catch (error) {
      errors.push({
        severity: 'error',
        message: `Invalid workflow YAML in ${file}: ${error.message}`,
        file: filePath,
        fix: 'Fix YAML syntax in workflow file'
      });
    }
  });

  return {
    component: 'GitHub Workflows',
    valid: errors.length === 0,
    errors,
    warnings
  };
}

async function validateToolConfigurations(options: ValidateOptions): Promise<ValidationResult> {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  // Configurations à vérifier
  const configs = [
    { file: '.eslintrc.json', name: 'ESLint' },
    { file: '.eslintrc.js', name: 'ESLint' },
    { file: '.prettierrc.json', name: 'Prettier' },
    { file: '.prettierrc', name: 'Prettier' },
    { file: 'jest.config.json', name: 'Jest' },
    { file: 'jest.config.js', name: 'Jest' }
  ];

  configs.forEach(config => {
    if (existsSync(config.file)) {
      try {
        if (config.file.endsWith('.json')) {
          JSON.parse(readFileSync(config.file, 'utf8'));
        } else if (config.file.endsWith('.js')) {
          // Pour les fichiers JS, on vérifie juste qu'ils sont lisibles
          readFileSync(config.file, 'utf8');
        }
      } catch (error) {
        errors.push({
          severity: 'error',
          message: `Invalid ${config.name} configuration: ${error.message}`,
          file: config.file,
          fix: `Fix syntax in ${config.file}`
        });
      }
    }
  });

  // Vérifier .gitignore
  if (existsSync('.gitignore')) {
    const gitignore = readFileSync('.gitignore', 'utf8');
    const essentialEntries = ['node_modules/', '.env', 'dist/', 'coverage/'];

    essentialEntries.forEach(entry => {
      if (!gitignore.includes(entry)) {
        warnings.push({
          severity: 'warning',
          message: `Missing ${entry} in .gitignore`,
          file: '.gitignore',
          fix: `Add ${entry} to .gitignore`
        });
      }
    });
  } else {
    warnings.push({
      severity: 'warning',
      message: '.gitignore file not found',
      file: '.gitignore',
      fix: 'Create .gitignore file'
    });
  }

  return {
    component: 'Tool Configurations',
    valid: errors.length === 0,
    errors,
    warnings
  };
}

async function validateProjectStructure(options: ValidateOptions): Promise<ValidationResult> {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  // Vérifier la structure de répertoires recommandée
  const recommendedDirs = [
    { path: 'src', required: false, message: 'Source directory not found' },
    { path: 'tests', required: false, message: 'Tests directory not found', alternatives: ['test', '__tests__'] },
    { path: 'docs', required: false, message: 'Documentation directory not found' }
  ];

  recommendedDirs.forEach(dir => {
    let found = existsSync(dir.path);

    if (!found && dir.alternatives) {
      found = dir.alternatives.some(alt => existsSync(alt));
    }

    if (!found) {
      if (dir.required) {
        errors.push({
          severity: 'error',
          message: dir.message,
          file: dir.path,
          fix: `Create ${dir.path} directory`
        });
      } else {
        warnings.push({
          severity: 'warning',
          message: dir.message,
          file: dir.path,
          fix: `Consider creating ${dir.path} directory`
        });
      }
    }
  });

  // Vérifier les fichiers essentiels
  const essentialFiles = [
    { path: 'README.md', required: false, message: 'README.md not found' },
    { path: 'LICENSE', required: false, message: 'LICENSE file not found' }
  ];

  essentialFiles.forEach(file => {
    if (!existsSync(file.path)) {
      if (file.required) {
        errors.push({
          severity: 'error',
          message: file.message,
          file: file.path,
          fix: `Create ${file.path}`
        });
      } else {
        warnings.push({
          severity: 'warning',
          message: file.message,
          file: file.path,
          fix: `Consider adding ${file.path}`
        });
      }
    }
  });

  return {
    component: 'Project Structure',
    valid: errors.length === 0,
    errors,
    warnings
  };
}

function displayValidationResults(results: ValidationResult[]): void {
  console.log(chalk.white.bold('📋 Validation Results:'));
  console.log();

  results.forEach(result => {
    const statusIcon = result.valid ? '✅' : '❌';
    const statusColor = result.valid ? 'green' : 'red';

    console.log(`${statusIcon} ${chalk.white.bold(result.component)} ${chalk[statusColor](result.valid ? 'VALID' : 'INVALID')}`);

    // Afficher les erreurs
    result.errors.forEach(error => {
      console.log(`   🔴 ${chalk.red('ERROR')}: ${error.message}`);
      if (error.file) {
        console.log(`      ${chalk.gray('File:')} ${error.file}${error.line ? ':' + error.line : ''}`);
      }
      if (error.fix) {
        console.log(`      ${chalk.gray('Fix:')} ${error.fix}`);
      }
    });

    // Afficher les avertissements
    result.warnings.forEach(warning => {
      console.log(`   🟡 ${chalk.yellow('WARNING')}: ${warning.message}`);
      if (warning.file) {
        console.log(`      ${chalk.gray('File:')} ${warning.file}${warning.line ? ':' + warning.line : ''}`);
      }
      if (warning.fix) {
        console.log(`      ${chalk.gray('Fix:')} ${warning.fix}`);
      }
    });

    console.log();
  });
}

function generateValidationSummary(results: ValidationResult[]): any {
  const total = results.length;
  const valid = results.filter(r => r.valid).length;
  const invalid = results.filter(r => !r.valid).length;

  const totalErrors = results.reduce((sum, r) => sum + r.errors.length, 0);
  const totalWarnings = results.reduce((sum, r) => sum + r.warnings.length, 0);

  return { total, valid, invalid, errors: totalErrors, warnings: totalWarnings };
}

function displayValidationSummary(summary: any): void {
  console.log(chalk.white.bold('📊 Validation Summary:'));
  console.log(`   Components: ${summary.total} total, ${summary.valid} valid, ${summary.invalid} invalid`);
  console.log(`   Issues: ${summary.errors} errors, ${summary.warnings} warnings`);
  console.log();

  if (summary.errors > 0) {
    console.log(chalk.red('❌ Validation failed - fix errors before proceeding'));
  } else if (summary.warnings > 0) {
    console.log(chalk.yellow('⚠️  Validation passed with warnings'));
  } else {
    console.log(chalk.green('✅ All validations passed!'));
  }

  console.log();
  console.log(chalk.white.bold('🔧 Next Steps:'));
  if (summary.errors > 0) {
    console.log(chalk.gray('  • Fix validation errors'));
    console.log(chalk.gray('  • Run validation again: '), chalk.cyan('claude-stack validate'));
  }
  if (summary.warnings > 0) {
    console.log(chalk.gray('  • Consider addressing warnings'));
  }
  console.log(chalk.gray('  • Run audit: '), chalk.cyan('claude-stack audit'));
  console.log(chalk.gray('  • Check status: '), chalk.cyan('claude-stack status'));
}