#!/usr/bin/env node

/**
 * Setup Quality Workspace - Initialize quality system for new project
 *
 * This script sets up the complete quality guard system for a new project,
 * inheriting patterns and best practices from the workspace-wide knowledge base.
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import path from 'path';

class QualityWorkspaceSetup {
  constructor(options = {}) {
    this.projectPath = process.cwd();
    this.projectName = path.basename(this.projectPath);
    this.claudeMetaPath = path.resolve('../../.claude-meta');
    this.dryRun = options.dryRun || false;
    this.verbose = options.verbose || false;

    this.results = {
      templatesInstalled: [],
      patternsInherited: 0,
      configsCreated: [],
      errors: []
    };
  }

  async setup() {
    console.log('🚀 Setting up Quality Workspace for:', this.projectName);
    console.log('📍 Project path:', this.projectPath);
    console.log('🔧 Claude Meta path:', this.claudeMetaPath);

    if (this.dryRun) {
      console.log('🧪 DRY RUN MODE - No files will be modified\n');
    }

    try {
      // 1. Validate environment
      await this.validateEnvironment();

      // 2. Detect project type
      const projectType = await this.detectProjectType();

      // 3. Install quality templates
      await this.installQualityTemplates(projectType);

      // 4. Inherit cross-project patterns
      await this.inheritCrossProjectPatterns();

      // 5. Setup package.json scripts
      await this.setupPackageScripts();

      // 6. Initialize baseline
      await this.initializeBaseline();

      // 7. Generate summary
      this.generateSummary();

      return true;

    } catch (error) {
      console.error('❌ Setup failed:', error.message);
      this.results.errors.push(error.message);
      return false;
    }
  }

  async validateEnvironment() {
    console.log('🔍 Validating environment...');

    // Check if in git repository
    if (!existsSync('.git')) {
      throw new Error('Not a git repository. Initialize git first: git init');
    }

    // Check Claude Meta exists
    if (!existsSync(this.claudeMetaPath)) {
      throw new Error(`Claude Meta not found at ${this.claudeMetaPath}`);
    }

    // Check quality templates exist
    const qualityTemplatesPath = path.join(this.claudeMetaPath, 'quality-templates');
    if (!existsSync(qualityTemplatesPath)) {
      throw new Error('Quality templates not found. Run setup first.');
    }

    console.log('  ✓ Environment validation passed');
  }

  async detectProjectType() {
    console.log('🔍 Detecting project type...');

    const indicators = {
      'package.json': 'javascript',
      'tsconfig.json': 'typescript',
      'pyproject.toml': 'python',
      'requirements.txt': 'python',
      'Cargo.toml': 'rust',
      'go.mod': 'go'
    };

    const detectedTypes = [];
    for (const [file, type] of Object.entries(indicators)) {
      if (existsSync(file)) {
        detectedTypes.push(type);
      }
    }

    let projectType = 'mixed';
    if (detectedTypes.length === 1) {
      projectType = detectedTypes[0];
    } else if (detectedTypes.includes('typescript')) {
      projectType = 'typescript';
    } else if (detectedTypes.includes('javascript')) {
      projectType = 'javascript';
    }

    console.log(`  ✓ Detected project type: ${projectType}`);
    return projectType;
  }

  async installQualityTemplates(projectType) {
    console.log('📦 Installing quality templates...');

    const templatesPath = path.join(this.claudeMetaPath, 'quality-templates', 'scripts');
    const scripts = [
      'historical-extractor-template.js',
      'serena-guards-template.js',
      'integration-template.js'
    ];

    // Ensure scripts directory exists
    if (!existsSync('scripts')) {
      if (!this.dryRun) {
        mkdirSync('scripts', { recursive: true });
      }
      console.log('  ✓ Created scripts directory');
    }

    for (const templateFile of scripts) {
      const templatePath = path.join(templatesPath, templateFile);
      if (existsSync(templatePath)) {
        const targetFile = templateFile.replace('-template', '');
        const targetPath = path.join('scripts', targetFile);

        if (!existsSync(targetPath)) {
          if (!this.dryRun) {
            // Copy and customize template
            let content = readFileSync(templatePath, 'utf8');

            // Customize for project
            content = content.replace(
              'process.env.PROJECT_NAME || \'generic-project\'',
              `'${this.projectName}'`
            );
            content = content.replace(
              'process.env.PROJECT_TYPE || \'javascript\'',
              `'${projectType}'`
            );

            writeFileSync(targetPath, content);
          }

          console.log(`  ✓ Installed ${targetFile}`);
          this.results.templatesInstalled.push(targetFile);
        } else {
          console.log(`  ↳ ${targetFile} already exists, skipping`);
        }
      }
    }
  }

  async inheritCrossProjectPatterns() {
    console.log('🧬 Inheriting cross-project patterns...');

    const crossProjectPath = path.join(
      this.claudeMetaPath,
      'quality-templates',
      'patterns-database',
      'cross-project-patterns.json'
    );

    if (!existsSync(crossProjectPath)) {
      console.log('  ℹ️  No cross-project patterns found yet');
      return;
    }

    try {
      const crossProjectData = JSON.parse(readFileSync(crossProjectPath, 'utf8'));
      const globalPatterns = crossProjectData.globalPatterns || {};

      // Find patterns that affect multiple projects
      const inheritablePatterns = Object.entries(globalPatterns)
        .filter(([, pattern]) => pattern.projectsAffected.length >= 2)
        .map(([type, pattern]) => ({
          name: `inherited_${type}`,
          severity: pattern.severity,
          description: `${pattern.description} (found in ${pattern.projectsAffected.length} projects)`,
          source: 'cross-project-database',
          projectsAffected: pattern.projectsAffected
        }));

      if (inheritablePatterns.length > 0) {
        // Create inherited patterns config
        const configContent = `// Inherited patterns from cross-project database
// Generated by .claude-meta/quality-templates/automation/setup-quality-workspace.js
// Date: ${new Date().toISOString()}

export const inheritedPatterns = ${JSON.stringify(inheritablePatterns, null, 2)};

export const inheritanceMetadata = {
  projectName: "${this.projectName}",
  inheritedFrom: "cross-project-database",
  inheritedAt: "${new Date().toISOString()}",
  patternsCount: ${inheritablePatterns.length}
};
`;

        if (!this.dryRun) {
          writeFileSync('scripts/inherited-patterns-config.js', configContent);
        }

        console.log(`  ✓ Inherited ${inheritablePatterns.length} cross-project patterns`);
        this.results.patternsInherited = inheritablePatterns.length;
      } else {
        console.log('  ℹ️  No inheritable patterns found');
      }

    } catch (error) {
      console.warn('  ⚠️  Could not inherit cross-project patterns:', error.message);
    }
  }

  async setupPackageScripts() {
    console.log('📝 Setting up package.json scripts...');

    if (!existsSync('package.json')) {
      console.log('  ℹ️  No package.json found, skipping script setup');
      return;
    }

    try {
      const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));

      // Quality scripts to add
      const qualityScripts = {
        'quality:setup': 'node scripts/setup-quality-guards.js',
        'quality:full': 'npm run serena:quality && npm run quality:debt:check && npm run dependency:check',
        'serena:quality': 'node scripts/serena-quality-guards.js',
        'serena:quality:fix': 'node scripts/serena-quality-guards.js --fix',
        'serena:quality:verbose': 'node scripts/serena-quality-guards.js --verbose',
        'history:extract': 'node scripts/historical-pattern-extractor.js --export-rules',
        'history:analyze': 'node scripts/historical-pattern-extractor.js --verbose',
        'history:integrate': 'node scripts/integrate-historical-patterns.js',
        'dependency:check': 'node scripts/dependency-guard.js --check'
      };

      // Add scripts that don't already exist
      const scriptsAdded = [];
      for (const [scriptName, scriptCommand] of Object.entries(qualityScripts)) {
        if (!packageJson.scripts[scriptName]) {
          packageJson.scripts[scriptName] = scriptCommand;
          scriptsAdded.push(scriptName);
        }
      }

      if (scriptsAdded.length > 0 && !this.dryRun) {
        writeFileSync('package.json', JSON.stringify(packageJson, null, 2));
        console.log(`  ✓ Added ${scriptsAdded.length} quality scripts`);
        this.results.configsCreated.push('package.json scripts');
      } else {
        console.log('  ↳ Quality scripts already configured');
      }

    } catch (error) {
      console.warn('  ⚠️  Could not setup package scripts:', error.message);
    }
  }

  async initializeBaseline() {
    console.log('📊 Initializing quality baseline...');

    if (!this.dryRun) {
      try {
        // Run initial quality analysis
        console.log('  🔍 Running initial analysis...');
        execSync('npm run history:extract', { stdio: 'pipe' });
        console.log('  ✓ Historical analysis complete');

        // Setup quality guards
        if (existsSync('scripts/setup-quality-guards.js')) {
          console.log('  🛡️  Setting up quality guards...');
          execSync('npm run quality:setup', { stdio: 'pipe' });
          console.log('  ✓ Quality guards configured');
        }

      } catch (error) {
        console.warn('  ⚠️  Baseline initialization had issues (this is normal for new projects)');
      }
    } else {
      console.log('  ↳ Baseline initialization skipped (dry run)');
    }
  }

  generateSummary() {
    console.log('\n📊 Quality Workspace Setup Summary');
    console.log('=' .repeat(50));

    console.log(`\n✅ Setup Results:`);
    console.log(`  Project: ${this.projectName}`);
    console.log(`  Templates installed: ${this.results.templatesInstalled.length}`);
    console.log(`  Cross-project patterns inherited: ${this.results.patternsInherited}`);
    console.log(`  Configurations created: ${this.results.configsCreated.length}`);

    if (this.results.templatesInstalled.length > 0) {
      console.log(`\n📦 Installed Templates:`);
      this.results.templatesInstalled.forEach(template => {
        console.log(`  ✓ scripts/${template}`);
      });
    }

    if (this.results.configsCreated.length > 0) {
      console.log(`\n⚙️  Configurations Created:`);
      this.results.configsCreated.forEach(config => {
        console.log(`  ✓ ${config}`);
      });
    }

    if (this.results.errors.length > 0) {
      console.log(`\n⚠️  Errors encountered:`);
      this.results.errors.forEach(error => {
        console.log(`  - ${error}`);
      });
    }

    console.log(`\n🚀 Next Steps:`);
    console.log(`  1. npm run quality:full           # Test quality system`);
    console.log(`  2. npm run history:analyze        # Review historical patterns`);
    console.log(`  3. git add . && git commit        # Commit quality setup`);
    console.log(`  4. Regular usage: npm run validate # Daily validation`);

    const successRate = ((4 - this.results.errors.length) / 4) * 100;
    console.log(`\n🎯 Setup Success Rate: ${Math.round(successRate)}%`);

    if (successRate >= 80) {
      console.log('\n🎉 Quality workspace setup successful!');
      console.log('Your project now benefits from workspace-wide quality intelligence.');
    }
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);

  const options = {
    dryRun: args.includes('--dry-run'),
    verbose: args.includes('--verbose') || args.includes('-v')
  };

  const setup = new QualityWorkspaceSetup(options);
  const success = await setup.setup();

  process.exit(success ? 0 : 1);
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { QualityWorkspaceSetup };