#!/usr/bin/env node

/**
 * Sync Patterns Across Projects - Cross-project quality intelligence
 *
 * This script synchronizes quality patterns discovered in one project
 * to all other projects in the workspace, enabling organization-wide learning.
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'fs';
import path from 'path';

class CrossProjectPatternSync {
  constructor(options = {}) {
    this.workspaceRoot = path.resolve('../../..');
    this.claudeMetaPath = path.join(this.workspaceRoot, '.claude-meta');
    this.dryRun = options.dryRun || false;
    this.verbose = options.verbose || false;
    this.forceSync = options.force || false;

    this.results = {
      projectsScanned: 0,
      patternsCollected: 0,
      projectsUpdated: 0,
      newGlobalPatterns: 0,
      errors: []
    };
  }

  async sync() {
    console.log('🔄 Cross-Project Pattern Sync');
    console.log('=' .repeat(40));
    console.log(`📁 Workspace: ${this.workspaceRoot}`);

    if (this.dryRun) {
      console.log('🧪 DRY RUN MODE - No files will be modified\n');
    }

    try {
      // 1. Discover projects in workspace
      const projects = await this.discoverProjects();

      // 2. Collect patterns from all projects
      const allPatterns = await this.collectPatternsFromProjects(projects);

      // 3. Analyze and consolidate patterns
      const consolidatedPatterns = await this.consolidatePatterns(allPatterns);

      // 4. Update cross-project database
      await this.updateCrossProjectDatabase(consolidatedPatterns);

      // 5. Sync new patterns back to projects
      await this.syncPatternsToProjects(projects, consolidatedPatterns);

      // 6. Generate report
      this.generateReport();

      return true;

    } catch (error) {
      console.error('❌ Sync failed:', error.message);
      this.results.errors.push(error.message);
      return false;
    }
  }

  async discoverProjects() {
    console.log('🔍 Discovering projects in workspace...');

    const projects = [];
    const entries = readdirSync(this.workspaceRoot, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isDirectory() && !entry.name.startsWith('.')) {
        const projectPath = path.join(this.workspaceRoot, entry.name);

        // Check if it's a valid project (has git and package.json or similar)
        const isProject = existsSync(path.join(projectPath, '.git')) &&
          (existsSync(path.join(projectPath, 'package.json')) ||
           existsSync(path.join(projectPath, 'pyproject.toml')) ||
           existsSync(path.join(projectPath, 'Cargo.toml')));

        if (isProject) {
          projects.push({
            name: entry.name,
            path: projectPath,
            type: await this.detectProjectType(projectPath)
          });
        }
      }
    }

    this.results.projectsScanned = projects.length;
    console.log(`  ✓ Found ${projects.length} projects`);

    if (this.verbose) {
      projects.forEach(project => {
        console.log(`    - ${project.name} (${project.type})`);
      });
    }

    return projects;
  }

  async detectProjectType(projectPath) {
    const indicators = {
      'package.json': 'javascript',
      'tsconfig.json': 'typescript',
      'pyproject.toml': 'python',
      'Cargo.toml': 'rust'
    };

    for (const [file, type] of Object.entries(indicators)) {
      if (existsSync(path.join(projectPath, file))) {
        return type;
      }
    }

    return 'unknown';
  }

  async collectPatternsFromProjects(projects) {
    console.log('📊 Collecting patterns from projects...');

    const allPatterns = {
      projectData: {},
      patterns: new Map()
    };

    for (const project of projects) {
      try {
        const patterns = await this.collectFromProject(project);
        if (patterns) {
          allPatterns.projectData[project.name] = patterns;
          this.mergePatterns(allPatterns.patterns, patterns.patterns || []);
          this.results.patternsCollected += patterns.patterns?.length || 0;
        }
      } catch (error) {
        console.warn(`  ⚠️  Could not collect from ${project.name}:`, error.message);
        this.results.errors.push(`${project.name}: ${error.message}`);
      }
    }

    console.log(`  ✓ Collected patterns from ${Object.keys(allPatterns.projectData).length} projects`);
    console.log(`  📈 Total unique patterns: ${allPatterns.patterns.size}`);

    return allPatterns;
  }

  async collectFromProject(project) {
    const patternsPath = path.join(project.path, 'scripts', 'historical-patterns-config.js');

    if (!existsSync(patternsPath)) {
      if (this.verbose) {
        console.log(`    ↳ ${project.name}: No historical patterns found`);
      }
      return null;
    }

    try {
      // Read the historical patterns file
      const content = readFileSync(patternsPath, 'utf8');

      // Extract patterns data (simple regex-based extraction)
      const metricsMatch = content.match(/export const historicalMetrics = ({[^}]+})/s);
      const patternsMatch = content.match(/export const historicalAntiPatterns = (\[[^\]]+\])/s);

      let metrics = {};
      let patterns = [];

      if (metricsMatch) {
        try {
          // Simple eval (in real implementation, use proper parsing)
          metrics = eval(`(${metricsMatch[1]})`);
        } catch {
          metrics = { extractionDate: new Date().toISOString() };
        }
      }

      if (patternsMatch) {
        try {
          patterns = eval(`(${patternsMatch[1]})`);
        } catch {
          patterns = [];
        }
      }

      if (this.verbose) {
        console.log(`    ✓ ${project.name}: ${patterns.length} patterns`);
      }

      return {
        project: project.name,
        type: project.type,
        metrics,
        patterns,
        lastUpdated: metrics.extractionDate || new Date().toISOString()
      };

    } catch (error) {
      throw new Error(`Failed to read patterns: ${error.message}`);
    }
  }

  mergePatterns(targetMap, newPatterns) {
    for (const pattern of newPatterns) {
      const key = pattern.name || pattern.type;
      if (targetMap.has(key)) {
        const existing = targetMap.get(key);
        existing.occurrences = (existing.occurrences || 1) + 1;
        existing.projects.push(pattern.projectSpecific || 'unknown');
      } else {
        targetMap.set(key, {
          ...pattern,
          occurrences: 1,
          projects: [pattern.projectSpecific || 'unknown']
        });
      }
    }
  }

  async consolidatePatterns(allPatterns) {
    console.log('🧮 Consolidating patterns...');

    const consolidated = {
      globalPatterns: {},
      recommendations: [],
      metrics: {
        totalProjects: Object.keys(allPatterns.projectData).length,
        totalPatterns: allPatterns.patterns.size,
        consolidatedAt: new Date().toISOString()
      }
    };

    // Convert patterns to global format
    allPatterns.patterns.forEach((pattern, key) => {
      consolidated.globalPatterns[key] = {
        totalOccurrences: pattern.occurrences,
        projectsAffected: [...new Set(pattern.projects)],
        severity: pattern.severity,
        description: pattern.message || pattern.description,
        lastSeen: new Date().toISOString(),
        pattern: pattern.pattern || 'N/A'
      };

      // Generate recommendations for high-impact patterns
      if (pattern.occurrences >= 3 || pattern.projects.length >= 2) {
        consolidated.recommendations.push({
          type: 'high-impact-pattern',
          pattern: key,
          impact: `Found in ${pattern.projects.length} projects`,
          recommendation: 'Consider adding to workspace-wide quality guards',
          priority: pattern.projects.length >= 3 ? 'high' : 'medium'
        });
      }
    });

    console.log(`  ✓ Consolidated ${Object.keys(consolidated.globalPatterns).length} global patterns`);
    console.log(`  📋 Generated ${consolidated.recommendations.length} recommendations`);

    return consolidated;
  }

  async updateCrossProjectDatabase(consolidatedPatterns) {
    console.log('💾 Updating cross-project database...');

    const databasePath = path.join(
      this.claudeMetaPath,
      'quality-templates',
      'patterns-database',
      'cross-project-patterns.json'
    );

    try {
      // Load existing database
      let existingData = { projects: {}, globalPatterns: {}, history: [] };
      if (existsSync(databasePath)) {
        existingData = JSON.parse(readFileSync(databasePath, 'utf8'));
      }

      // Count new patterns
      const existingPatternCount = Object.keys(existingData.globalPatterns).length;

      // Merge with existing data
      const updatedData = {
        ...existingData,
        globalPatterns: {
          ...existingData.globalPatterns,
          ...consolidatedPatterns.globalPatterns
        },
        lastSync: new Date().toISOString(),
        syncMetrics: consolidatedPatterns.metrics,
        recommendations: consolidatedPatterns.recommendations
      };

      // Add to history
      updatedData.history = updatedData.history || [];
      updatedData.history.push({
        timestamp: new Date().toISOString(),
        patternsAdded: Object.keys(consolidatedPatterns.globalPatterns).length,
        projectsScanned: consolidatedPatterns.metrics.totalProjects
      });

      // Keep only last 10 history entries
      updatedData.history = updatedData.history.slice(-10);

      if (!this.dryRun) {
        writeFileSync(databasePath, JSON.stringify(updatedData, null, 2));
      }

      this.results.newGlobalPatterns = Object.keys(consolidatedPatterns.globalPatterns).length - existingPatternCount;
      console.log(`  ✓ Database updated`);
      console.log(`  📈 New global patterns: ${this.results.newGlobalPatterns}`);

    } catch (error) {
      throw new Error(`Failed to update database: ${error.message}`);
    }
  }

  async syncPatternsToProjects(projects, consolidatedPatterns) {
    console.log('🔄 Syncing patterns back to projects...');

    // Find high-impact patterns that should be propagated
    const highImpactPatterns = Object.entries(consolidatedPatterns.globalPatterns)
      .filter(([, pattern]) => pattern.projectsAffected.length >= 2)
      .reduce((acc, [key, pattern]) => {
        acc[key] = pattern;
        return acc;
      }, {});

    if (Object.keys(highImpactPatterns).length === 0) {
      console.log('  ℹ️  No high-impact patterns to sync');
      return;
    }

    for (const project of projects) {
      try {
        await this.syncToProject(project, highImpactPatterns);
        this.results.projectsUpdated++;
      } catch (error) {
        console.warn(`  ⚠️  Could not sync to ${project.name}:`, error.message);
      }
    }

    console.log(`  ✓ Synced patterns to ${this.results.projectsUpdated} projects`);
  }

  async syncToProject(project, highImpactPatterns) {
    const inheritedConfigPath = path.join(project.path, 'scripts', 'inherited-patterns-config.js');

    // Check if project already has updated patterns
    if (existsSync(inheritedConfigPath) && !this.forceSync) {
      const existingContent = readFileSync(inheritedConfigPath, 'utf8');
      const lastUpdate = existingContent.match(/inheritedAt: "([^"]+)"/)?.[1];

      if (lastUpdate) {
        const lastUpdateTime = new Date(lastUpdate).getTime();
        const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);

        if (lastUpdateTime > oneDayAgo) {
          if (this.verbose) {
            console.log(`    ↳ ${project.name}: Recently updated, skipping`);
          }
          return;
        }
      }
    }

    // Generate inherited patterns config
    const inheritedPatterns = Object.entries(highImpactPatterns).map(([key, pattern]) => ({
      name: `inherited_${key}`,
      severity: pattern.severity,
      description: `${pattern.description} (found in ${pattern.projectsAffected.length} projects)`,
      source: 'cross-project-sync',
      projectsAffected: pattern.projectsAffected,
      lastSeen: pattern.lastSeen
    }));

    const configContent = `// Inherited patterns from cross-project sync
// Generated by .claude-meta/quality-templates/automation/sync-patterns-across-projects.js
// Date: ${new Date().toISOString()}

export const inheritedPatterns = ${JSON.stringify(inheritedPatterns, null, 2)};

export const inheritanceMetadata = {
  projectName: "${project.name}",
  inheritedFrom: "cross-project-sync",
  inheritedAt: "${new Date().toISOString()}",
  patternsCount: ${inheritedPatterns.length},
  highImpactPatternsOnly: true
};
`;

    if (!this.dryRun) {
      writeFileSync(inheritedConfigPath, configContent);
    }

    if (this.verbose) {
      console.log(`    ✓ ${project.name}: ${inheritedPatterns.length} patterns inherited`);
    }
  }

  generateReport() {
    console.log('\n📊 Cross-Project Pattern Sync Report');
    console.log('=' .repeat(50));

    console.log(`\n📈 Sync Results:`);
    console.log(`  Projects scanned: ${this.results.projectsScanned}`);
    console.log(`  Patterns collected: ${this.results.patternsCollected}`);
    console.log(`  Projects updated: ${this.results.projectsUpdated}`);
    console.log(`  New global patterns: ${this.results.newGlobalPatterns}`);

    if (this.results.errors.length > 0) {
      console.log(`\n⚠️  Errors encountered:`);
      this.results.errors.slice(0, 5).forEach(error => {
        console.log(`  - ${error}`);
      });
      if (this.results.errors.length > 5) {
        console.log(`  ... and ${this.results.errors.length - 5} more`);
      }
    }

    console.log(`\n📁 Updated Files:`);
    console.log(`  ✓ .claude-meta/quality-templates/patterns-database/cross-project-patterns.json`);
    console.log(`  ✓ ${this.results.projectsUpdated} project inherited-patterns-config.js files`);

    console.log(`\n🚀 Next Steps:`);
    console.log(`  1. Review cross-project patterns:`);
    console.log(`     cat .claude-meta/quality-templates/patterns-database/cross-project-patterns.json`);
    console.log(`  2. Test in individual projects:`);
    console.log(`     npm run quality:full`);
    console.log(`  3. Schedule regular sync (weekly):`);
    console.log(`     node .claude-meta/quality-templates/automation/sync-patterns-across-projects.js`);

    const successRate = this.results.projectsScanned > 0
      ? Math.round((this.results.projectsUpdated / this.results.projectsScanned) * 100)
      : 100;

    console.log(`\n🎯 Sync Success Rate: ${successRate}%`);

    if (successRate >= 80) {
      console.log('\n🎉 Cross-project pattern sync successful!');
      console.log('Projects are now sharing quality intelligence across the workspace.');
    }
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);

  const options = {
    dryRun: args.includes('--dry-run'),
    verbose: args.includes('--verbose') || args.includes('-v'),
    force: args.includes('--force')
  };

  const sync = new CrossProjectPatternSync(options);
  const success = await sync.sync();

  process.exit(success ? 0 : 1);
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { CrossProjectPatternSync };