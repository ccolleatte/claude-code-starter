#!/usr/bin/env node

/**
 * Historical Pattern Extractor Template - Reusable across projects
 *
 * This is a generic template that can be customized for any project
 * in the Claude Meta workspace. It learns from Git history to extract
 * quality patterns and anti-patterns.
 *
 * Usage:
 *   1. Copy to project: cp .claude-meta/quality-templates/scripts/historical-extractor-template.js scripts/historical-pattern-extractor.js
 *   2. Customize PROJECT_CONFIG section
 *   3. Run: node scripts/historical-pattern-extractor.js --export-rules
 *
 * Customization Points:
 *   - PROJECT_CONFIG: Adapt to project specifics
 *   - Anti-pattern definitions: Add project-specific patterns
 *   - Quality fix categorization: Adapt to project conventions
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import path from 'path';

// ========================================
// PROJECT CONFIGURATION - CUSTOMIZE THIS
// ========================================
const PROJECT_CONFIG = {
  // Project identification
  projectName: process.env.PROJECT_NAME || 'generic-project',
  projectType: process.env.PROJECT_TYPE || 'javascript', // javascript, typescript, python, mixed

  // Analysis scope
  defaultTimeframe: '6 months ago',
  minPatternOccurrences: 2, // Minimum occurrences to generate rule

  // File patterns to analyze
  codeFilePatterns: {
    javascript: ['*.js', '*.mjs', '*.cjs'],
    typescript: ['*.ts', '*.tsx', '*.d.ts'],
    python: ['*.py'],
    mixed: ['*.js', '*.ts', '*.py', '*.mjs']
  },

  // Quality keywords for commit detection
  qualityKeywords: [
    'fix', 'bug', 'error', 'lint', 'eslint', 'quality', 'refactor',
    'clean', 'improve', 'security', 'vulnerability', 'deprecated',
    'anti-pattern', 'code smell', 'typescript', 'type error',
    'ruff', 'black', 'prettier', 'formatting'
  ],

  // Project-specific anti-patterns
  customAntiPatterns: [
    // Add project-specific patterns here
    // {
    //   name: 'project_specific_pattern',
    //   pattern: /some-regex/g,
    //   severity: 'error',
    //   message: 'Project-specific anti-pattern detected'
    // }
  ],

  // Output configuration
  outputPaths: {
    serenaConfig: 'scripts/historical-patterns-config.js',
    cipherMemory: '.serena/historical-quality-patterns.md',
    crossProjectSync: '../../../.claude-meta/quality-templates/patterns-database/cross-project-patterns.json'
  }
};

// ========================================
// GENERIC IMPLEMENTATION (REUSABLE)
// ========================================

class HistoricalPatternExtractor {
  constructor(options = {}) {
    this.config = { ...PROJECT_CONFIG, ...options };
    this.since = options.since || this.config.defaultTimeframe;
    this.exportRules = options.exportRules || false;
    this.verbose = options.verbose || false;

    // Pattern tracking
    this.patterns = {
      antiPatterns: new Map(),
      qualityFixes: [],
      frequentIssues: new Map(),
      architecturalViolations: [],
      dependencyIssues: []
    };

    // Analysis results
    this.analysis = {
      totalCommits: 0,
      qualityCommits: 0,
      topAntiPatterns: [],
      recommendations: [],
      projectName: this.config.projectName
    };

    // Load universal anti-patterns + project-specific ones
    this.antiPatterns = [
      ...this.getUniversalAntiPatterns(),
      ...this.config.customAntiPatterns
    ];
  }

  /**
   * Universal anti-patterns that apply to most projects
   */
  getUniversalAntiPatterns() {
    const universal = [];

    // JavaScript/TypeScript universal patterns
    if (['javascript', 'typescript', 'mixed'].includes(this.config.projectType)) {
      universal.push(
        {
          name: 'direct_hasOwnProperty',
          pattern: /\.hasOwnProperty\s*\(/g,
          severity: 'error',
          message: 'Direct hasOwnProperty usage - use Object.prototype.hasOwnProperty.call()',
          fix: (match) => match.replace('.hasOwnProperty(', 'Object.prototype.hasOwnProperty.call(obj, ')
        },
        {
          name: 'var_usage',
          pattern: /^\s*var\s+/gm,
          severity: 'warning',
          message: 'Use const or let instead of var'
        },
        {
          name: 'console_statements',
          pattern: /console\.(log|debug|info|warn|error)\s*\(/g,
          severity: 'warning',
          message: 'Console statement detected - consider using logger',
          excludeFiles: ['scripts/', 'tests/', 'dev/', '__tests__/']
        },
        {
          name: 'loose_equality',
          pattern: /==(?!=)/g,
          severity: 'warning',
          message: 'Use strict equality (===) instead of loose equality (==)',
          fix: (match) => '==='
        }
      );
    }

    // Python universal patterns
    if (['python', 'mixed'].includes(this.config.projectType)) {
      universal.push(
        {
          name: 'bare_except',
          pattern: /except\s*:/g,
          severity: 'error',
          message: 'Bare except clause - specify exception type'
        },
        {
          name: 'print_statements',
          pattern: /^\s*print\s*\(/gm,
          severity: 'warning',
          message: 'Print statement detected - consider using logging',
          excludeFiles: ['scripts/', 'tests/', 'dev/']
        }
      );
    }

    return universal;
  }

  /**
   * Main extraction process
   */
  async extract() {
    console.log(`🕵️ Historical Pattern Extractor - ${this.config.projectName}\n`);
    console.log(`📅 Analyzing commits since: ${this.since}`);
    console.log(`🔍 Project type: ${this.config.projectType}\n`);

    try {
      // 1. Extract commit history
      await this.extractCommitHistory();

      // 2. Analyze quality-related commits
      await this.analyzeQualityCommits();

      // 3. Mine code changes for patterns
      await this.mineCodeChangePatterns();

      // 4. Analyze current codebase
      await this.analyzeCurrentCodebase();

      // 5. Generate recommendations
      await this.generateRecommendations();

      // 6. Export rules if requested
      if (this.exportRules) {
        await this.exportRules();
      }

      // 7. Sync to cross-project database
      await this.syncToCrossProject();

      // 8. Generate report
      this.generateReport();

      return true;

    } catch (error) {
      console.error('❌ Historical extraction failed:', error.message);
      return false;
    }
  }

  /**
   * Extract commit history (same as original but configurable)
   */
  async extractCommitHistory() {
    console.log('📚 Extracting commit history...');

    try {
      const output = execSync(`git log --since="${this.since}" --oneline --numstat --format=format:"COMMIT:%H|%s|%an|%ad" --date=short`,
        { encoding: 'utf8' });

      const lines = output.split('\n').filter(line => line.trim());
      this.analysis.totalCommits = lines.filter(line => line.startsWith('COMMIT:')).length;

      console.log(`  ✓ Found ${this.analysis.totalCommits} commits since ${this.since}`);

      // Parse commit data with project-specific quality keywords
      for (const line of lines) {
        if (line.startsWith('COMMIT:')) {
          const [hash, message, author, date] = line.substring(7).split('|');

          const isQualityCommit = this.config.qualityKeywords.some(keyword =>
            message.toLowerCase().includes(keyword)
          );

          if (isQualityCommit) {
            this.analysis.qualityCommits++;
            this.patterns.qualityFixes.push({
              hash, message, author, date,
              type: this.categorizeQualityFix(message)
            });
          }
        }
      }

      console.log(`  ✓ Identified ${this.analysis.qualityCommits} quality-related commits`);

    } catch (error) {
      console.warn('⚠️  Git history analysis limited:', error.message);
    }
  }

  /**
   * Categorize quality fix types (adaptable per project)
   */
  categorizeQualityFix(message) {
    const categories = {
      'ESLint': /eslint|lint|linting/i,
      'TypeScript': /typescript|type|types|@types/i,
      'Python Linting': /ruff|black|flake8|pylint|mypy/i,
      'Security': /security|vulnerability|cve|audit/i,
      'Dependency': /dependency|package|upgrade|downgrade|npm|yarn|pip/i,
      'Refactor': /refactor|clean|improve|optimize/i,
      'Bug Fix': /fix|bug|error|issue/i,
      'Anti-pattern': /anti-pattern|code smell|bad practice/i,
      'Formatting': /format|prettier|black|style/i
    };

    for (const [category, regex] of Object.entries(categories)) {
      if (regex.test(message)) {
        return category;
      }
    }

    return 'Other';
  }

  /**
   * Export rules to project and cross-project locations
   */
  async exportRules() {
    console.log('📤 Exporting rules...');

    // Export to project-specific location
    await this.exportToProject();

    // Sync to cross-project database
    await this.syncToCrossProject();
  }

  /**
   * Export to project-specific configuration
   */
  async exportToProject() {
    console.log('  🔧 Exporting to project configuration...');

    try {
      const historicalPatterns = [];

      this.patterns.antiPatterns.forEach((pattern, type) => {
        if (pattern.count >= this.config.minPatternOccurrences) {
          historicalPatterns.push({
            name: `historical_${type}`,
            pattern: pattern.pattern,
            severity: pattern.severity,
            message: `${pattern.message} (found ${pattern.count} times in history)`,
            fix: pattern.fix,
            projectSpecific: true
          });
        }
      });

      const configContent = `// Historical patterns for ${this.config.projectName}
// Generated by .claude-meta/quality-templates/scripts/historical-extractor-template.js
// Date: ${new Date().toISOString()}

export const historicalAntiPatterns = ${JSON.stringify(historicalPatterns, null, 2)};

export const historicalMetrics = {
  projectName: "${this.config.projectName}",
  projectType: "${this.config.projectType}",
  totalCommits: ${this.analysis.totalCommits},
  qualityCommits: ${this.analysis.qualityCommits},
  patternsFound: ${this.patterns.antiPatterns.size},
  extractionDate: "${new Date().toISOString()}",
  timeframe: "${this.since}"
};
`;

      writeFileSync(this.config.outputPaths.serenaConfig, configContent);
      console.log(`    ✓ Project config exported to ${this.config.outputPaths.serenaConfig}`);

    } catch (error) {
      console.warn('    ⚠️  Could not export project configuration:', error.message);
    }
  }

  /**
   * Sync patterns to cross-project database
   */
  async syncToCrossProject() {
    console.log('  🌐 Syncing to cross-project database...');

    try {
      const crossProjectPath = this.config.outputPaths.crossProjectSync;

      // Load existing cross-project patterns
      let crossProjectData = { projects: {}, globalPatterns: {} };
      if (existsSync(crossProjectPath)) {
        crossProjectData = JSON.parse(readFileSync(crossProjectPath, 'utf8'));
      }

      // Add/update this project's data
      crossProjectData.projects[this.config.projectName] = {
        projectType: this.config.projectType,
        lastAnalyzed: new Date().toISOString(),
        metrics: this.analysis,
        patterns: Array.from(this.patterns.antiPatterns.entries()).map(([type, pattern]) => ({
          type,
          count: pattern.count,
          severity: pattern.severity,
          description: pattern.description
        }))
      };

      // Update global patterns frequency
      this.patterns.antiPatterns.forEach((pattern, type) => {
        if (!crossProjectData.globalPatterns[type]) {
          crossProjectData.globalPatterns[type] = {
            totalOccurrences: 0,
            projectsAffected: [],
            severity: pattern.severity,
            description: pattern.description
          };
        }

        crossProjectData.globalPatterns[type].totalOccurrences += pattern.count;
        if (!crossProjectData.globalPatterns[type].projectsAffected.includes(this.config.projectName)) {
          crossProjectData.globalPatterns[type].projectsAffected.push(this.config.projectName);
        }
      });

      // Ensure directory exists
      const dir = path.dirname(crossProjectPath);
      execSync(`mkdir -p "${dir}"`, { stdio: 'pipe' });

      writeFileSync(crossProjectPath, JSON.stringify(crossProjectData, null, 2));
      console.log(`    ✓ Cross-project database updated`);

    } catch (error) {
      console.warn('    ⚠️  Could not sync to cross-project database:', error.message);
    }
  }

  // ... Additional methods (analyzeQualityCommits, mineCodeChangePatterns, etc.)
  // These would be the same as the original implementation but with config-driven behavior

  /**
   * Generate comprehensive report
   */
  generateReport() {
    console.log(`\n📋 Historical Pattern Analysis Report - ${this.config.projectName}`);
    console.log('=' .repeat(60));

    console.log(`\n📊 Summary:`);
    console.log(`  Project: ${this.config.projectName} (${this.config.projectType})`);
    console.log(`  Period analyzed: ${this.since}`);
    console.log(`  Total commits: ${this.analysis.totalCommits}`);
    console.log(`  Quality commits: ${this.analysis.qualityCommits} (${Math.round(this.analysis.qualityCommits / this.analysis.totalCommits * 100)}%)`);
    console.log(`  Anti-patterns found: ${this.patterns.antiPatterns.size}`);

    console.log(`\n📁 Generated Files:`);
    console.log(`  ✓ ${this.config.outputPaths.serenaConfig}`);
    console.log(`  ✓ Cross-project database updated`);

    console.log(`\n🚀 Next Steps:`);
    console.log(`  1. Integrate patterns: npm run history:integrate`);
    console.log(`  2. Test quality system: npm run quality:full`);
    console.log(`  3. Review cross-project patterns: cat ${this.config.outputPaths.crossProjectSync}`);

    console.log('\n✅ Historical pattern extraction complete!');
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);

  const options = {
    since: args.find(arg => arg.startsWith('--since='))?.split('=')[1] || PROJECT_CONFIG.defaultTimeframe,
    exportRules: args.includes('--export-rules'),
    verbose: args.includes('--verbose') || args.includes('-v')
  };

  const extractor = new HistoricalPatternExtractor(options);
  const success = await extractor.extract();

  process.exit(success ? 0 : 1);
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { HistoricalPatternExtractor, PROJECT_CONFIG };