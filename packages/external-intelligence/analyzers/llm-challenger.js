#!/usr/bin/env node

/**
 * LLM Challenger - Multi-Model Challenge System
 *
 * Challenge nos pratiques via différents LLMs pour identifier
 * angles morts et opportunités d'amélioration
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class LLMChallenger {
  constructor(options = {}) {
    this.workspaceRoot = options.workspaceRoot || process.cwd();
    this.dryRun = options.dryRun || false;
    this.outputDir = path.join(__dirname, '../data/challenge-history');

    this.llmProviders = {
      claude: {
        model: 'claude-3-5-sonnet',
        strength: 'Code analysis & architecture critique',
        focus: 'Deep technical analysis'
      },
      openai: {
        model: 'gpt-4-turbo',
        strength: 'Industry trends & best practices',
        focus: 'Comparative analysis'
      },
      google: {
        model: 'gemini-pro',
        strength: 'Research & academic insights',
        focus: 'Innovation detection'
      }
    };

    this.challengeDomains = {
      architecture: {
        name: 'Architecture & Design Patterns',
        weight: 0.9,
        prompts: this.loadPromptTemplates('architecture')
      },
      testing: {
        name: 'Testing & Quality Strategies',
        weight: 0.85,
        prompts: this.loadPromptTemplates('testing')
      },
      devex: {
        name: 'Developer Experience',
        weight: 0.8,
        prompts: this.loadPromptTemplates('devex')
      },
      tooling: {
        name: 'Tooling & Ecosystem',
        weight: 0.75,
        prompts: this.loadPromptTemplates('tooling')
      }
    };

    this.ensureDirectories();
  }

  ensureDirectories() {
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  loadPromptTemplates(domain) {
    const templatePath = path.join(__dirname, '../templates/llm-prompts', `${domain}-prompts.json`);

    // Templates par défaut si fichier n'existe pas encore
    const defaultPrompts = {
      architecture: [
        "Analysez cette architecture et identifiez 3 faiblesses critiques que l'équipe pourrait ne pas voir",
        "Comparez cette approche architecturale aux standards de l'industrie 2024-2025",
        "Quels sont les risques techniques cachés dans cette stack ?",
        "Proposez 2 alternatives architecturales radicalement différentes"
      ],
      testing: [
        "Critiquez cette stratégie de test : qu'est-ce qui manque ou est inefficace ?",
        "Comment cette approche TDD se compare-t-elle aux meilleures pratiques actuelles ?",
        "Quels types de bugs cette stratégie de test laisserait-elle passer ?",
        "Proposez une approche de test complètement différente mais plus efficace"
      ],
      devex: [
        "Analysez ce workflow de développement : où les développeurs perdent-ils du temps ?",
        "Comment améliorer drastiquement l'expérience développeur de ce projet ?",
        "Quels outils ou pratiques modernes pourraient révolutionner ce workflow ?",
        "Identifiez les frictions cachées dans ce setup de développement"
      ],
      tooling: [
        "Cette stack d'outils est-elle optimale en 2024-2025 ? Que changeriez-vous ?",
        "Quels outils émergents pourraient remplacer avantageusement ceux utilisés ?",
        "Analysez la dette technique de cet écosystème d'outils",
        "Proposez une stack alternative plus moderne et efficace"
      ]
    };

    if (fs.existsSync(templatePath)) {
      return JSON.parse(fs.readFileSync(templatePath, 'utf8'));
    }

    return defaultPrompts[domain] || [];
  }

  async runChallengeSession(domain = 'all', targetLLMs = ['claude']) {
    console.log(`🤔 Starting LLM Challenge Session - Domain: ${domain}`);

    const sessionId = `challenge-${Date.now()}`;
    const results = {
      sessionId,
      timestamp: new Date().toISOString(),
      domain,
      challenges: [],
      summary: {},
      actionItems: []
    };

    const domains = domain === 'all' ? Object.keys(this.challengeDomains) : [domain];

    for (const domainKey of domains) {
      console.log(`\n📋 Challenging domain: ${this.challengeDomains[domainKey].name}`);

      const domainResults = await this.challengeDomain(domainKey, targetLLMs);
      results.challenges.push({
        domain: domainKey,
        results: domainResults
      });
    }

    results.summary = this.generateChallengeSummary(results.challenges);
    results.actionItems = this.extractActionItems(results.challenges);

    // Sauvegarder les résultats
    const outputFile = path.join(this.outputDir, `${sessionId}.json`);
    if (!this.dryRun) {
      fs.writeFileSync(outputFile, JSON.stringify(results, null, 2));
      console.log(`\n💾 Results saved to: ${outputFile}`);
    }

    this.displayResults(results);
    return results;
  }

  async challengeDomain(domain, targetLLMs) {
    const domainConfig = this.challengeDomains[domain];
    const prompts = domainConfig.prompts;
    const results = [];

    // Analyser le contexte current du workspace pour ce domaine
    const context = await this.gatherDomainContext(domain);

    for (const llm of targetLLMs) {
      console.log(`  🧠 Challenging with ${llm}...`);

      for (const promptTemplate of prompts) {
        const enhancedPrompt = this.enhancePromptWithContext(promptTemplate, context, domain);

        if (this.dryRun) {
          console.log(`    📝 Would challenge with: ${promptTemplate.substring(0, 80)}...`);
          continue;
        }

        const challenge = await this.executeLLMChallenge(llm, enhancedPrompt, context);
        results.push({
          llm,
          prompt: promptTemplate,
          context: context.summary,
          response: challenge,
          severity: this.assessChallengeSeverity(challenge),
          actionable: this.isActionable(challenge)
        });

        // Rate limiting between calls
        await this.sleep(1000);
      }
    }

    return results;
  }

  async gatherDomainContext(domain) {
    const context = {
      domain,
      files: [],
      summary: '',
      metrics: {}
    };

    try {
      switch (domain) {
        case 'architecture':
          context.files = this.findArchitectureFiles();
          context.summary = this.analyzeArchitecturePatterns();
          break;
        case 'testing':
          context.files = this.findTestFiles();
          context.metrics = this.gatherTestMetrics();
          break;
        case 'devex':
          context.files = this.findDevExperienceFiles();
          context.summary = this.analyzeWorkflowFiles();
          break;
        case 'tooling':
          context.files = this.findToolingFiles();
          context.summary = this.analyzeToolingStack();
          break;
      }
    } catch (error) {
      console.warn(`⚠️ Warning gathering context for ${domain}: ${error.message}`);
    }

    return context;
  }

  findArchitectureFiles() {
    const patterns = [
      'package.json',
      'docker-compose.yml',
      'Dockerfile',
      'CLAUDE.md',
      'src/**/*.js',
      'src/**/*.ts'
    ];

    return this.findFilesByPatterns(patterns).slice(0, 10); // Limiter pour éviter overload
  }

  findTestFiles() {
    const patterns = [
      'test/**/*.js',
      'tests/**/*.js',
      '**/*.test.js',
      '**/*.spec.js',
      'jest.config.js',
      'vitest.config.js'
    ];

    return this.findFilesByPatterns(patterns);
  }

  findDevExperienceFiles() {
    const patterns = [
      'package.json',
      'nodemon.json',
      'docker-compose.yml',
      '.github/workflows/*.yml',
      'scripts/*.js'
    ];

    return this.findFilesByPatterns(patterns);
  }

  findToolingFiles() {
    const patterns = [
      'package.json',
      'eslint.config.*',
      'prettier.config.*',
      'tsconfig.json',
      'turbo.json',
      'pnpm-workspace.yaml'
    ];

    return this.findFilesByPatterns(patterns);
  }

  findFilesByPatterns(patterns) {
    const files = [];

    for (const pattern of patterns) {
      try {
        // Simple glob implementation
        if (pattern.includes('**')) {
          const cmd = process.platform === 'win32'
            ? `dir /s /b ${pattern.replace('**/', '*').replace('/', '\\')}`
            : `find . -name "${pattern.split('/').pop()}" -type f`;

          const output = execSync(cmd, {
            cwd: this.workspaceRoot,
            encoding: 'utf8',
            stdio: 'pipe'
          }).trim();

          if (output) {
            files.push(...output.split('\n').map(f => f.trim()).filter(Boolean));
          }
        } else {
          const filePath = path.join(this.workspaceRoot, pattern);
          if (fs.existsSync(filePath)) {
            files.push(pattern);
          }
        }
      } catch (error) {
        // Ignorer les erreurs de patterns
      }
    }

    return [...new Set(files)]; // Dédupliquer
  }

  analyzeArchitecturePatterns() {
    try {
      const packageJson = path.join(this.workspaceRoot, 'package.json');
      if (fs.existsSync(packageJson)) {
        const pkg = JSON.parse(fs.readFileSync(packageJson, 'utf8'));
        return `Monorepo: ${!!pkg.workspaces}, Dependencies: ${Object.keys(pkg.dependencies || {}).length}, Scripts: ${Object.keys(pkg.scripts || {}).length}`;
      }
    } catch (error) {
      return 'Architecture analysis failed';
    }
    return 'No package.json found';
  }

  gatherTestMetrics() {
    try {
      // Essayer de lire un rapport de coverage récent
      const coverageFiles = [
        'coverage/coverage-summary.json',
        'coverage/lcov-report/index.html',
        '.nyc_output/coverage.json'
      ];

      for (const file of coverageFiles) {
        const filePath = path.join(this.workspaceRoot, file);
        if (fs.existsSync(filePath)) {
          if (file.endsWith('.json')) {
            const coverage = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            return {
              coverage: coverage.total || coverage,
              hasMetrics: true
            };
          }
          return { hasMetrics: true, source: file };
        }
      }
    } catch (error) {
      // Ignorer
    }

    return { hasMetrics: false };
  }

  analyzeWorkflowFiles() {
    const workflowIndicators = [];

    try {
      const packageJson = path.join(this.workspaceRoot, 'package.json');
      if (fs.existsSync(packageJson)) {
        const pkg = JSON.parse(fs.readFileSync(packageJson, 'utf8'));
        workflowIndicators.push(`Scripts: ${Object.keys(pkg.scripts || {}).join(', ')}`);
      }

      if (fs.existsSync(path.join(this.workspaceRoot, 'docker-compose.yml'))) {
        workflowIndicators.push('Docker Compose setup');
      }

      if (fs.existsSync(path.join(this.workspaceRoot, 'nodemon.json'))) {
        workflowIndicators.push('Hot reload configured');
      }
    } catch (error) {
      // Ignorer
    }

    return workflowIndicators.join(', ') || 'Basic workflow setup';
  }

  analyzeToolingStack() {
    const tools = [];

    try {
      const packageJson = path.join(this.workspaceRoot, 'package.json');
      if (fs.existsSync(packageJson)) {
        const pkg = JSON.parse(fs.readFileSync(packageJson, 'utf8'));
        const devDeps = Object.keys(pkg.devDependencies || {});

        // Identifier les catégories d'outils
        const categories = {
          linting: devDeps.filter(d => d.includes('eslint') || d.includes('prettier')),
          testing: devDeps.filter(d => d.includes('jest') || d.includes('vitest') || d.includes('test')),
          building: devDeps.filter(d => d.includes('webpack') || d.includes('vite') || d.includes('turbo')),
          typing: devDeps.filter(d => d.includes('typescript') || d.includes('@types'))
        };

        Object.entries(categories).forEach(([cat, deps]) => {
          if (deps.length > 0) {
            tools.push(`${cat}: ${deps.join(', ')}`);
          }
        });
      }
    } catch (error) {
      // Ignorer
    }

    return tools.join(' | ') || 'Standard tooling';
  }

  enhancePromptWithContext(promptTemplate, context, domain) {
    const contextSummary = `
Context for ${domain}:
- Files analyzed: ${context.files.slice(0, 5).join(', ')}${context.files.length > 5 ? '...' : ''}
- Summary: ${context.summary}
- Metrics: ${JSON.stringify(context.metrics)}

Based on this context: ${promptTemplate}

Provide specific, actionable critique focusing on:
1. Concrete issues you identify
2. Specific alternatives or improvements
3. Risk assessment and mitigation
4. Implementation recommendations

Be critical but constructive. Focus on high-impact improvements.`;

    return contextSummary;
  }

  async executeLLMChallenge(llm, prompt, context) {
    // Cette méthode simule un appel LLM
    // En production, intégrer avec les APIs réelles

    if (this.dryRun) {
      return `[DRY RUN] Would execute ${llm} challenge with prompt: ${prompt.substring(0, 100)}...`;
    }

    // Simulation d'une réponse critique
    const sampleCritiques = [
      "Architecture Analysis: The current monorepo structure creates unnecessary complexity. Consider module federation or micro-frontends approach. Risk: Tight coupling between components reduces deployment flexibility.",
      "Testing Gap: Missing property-based testing for complex business logic. Current unit tests don't cover edge cases. Recommendation: Integrate fast-check for critical functions.",
      "Developer Experience: Hot reload takes 2-3 seconds, impacting flow state. Switch to Vite or implement granular HMR. Time lost: ~30min/day per developer.",
      "Tooling Debt: ESLint configuration is outdated (v8 vs v9). Missing performance budgets. Consider switching to Biome for 10x faster linting."
    ];

    // Simuler un délai d'API
    await this.sleep(500);

    return sampleCritiques[Math.floor(Math.random() * sampleCritiques.length)];
  }

  assessChallengeSeverity(response) {
    const severityKeywords = {
      high: ['critical', 'risk', 'security', 'performance', 'blocking'],
      medium: ['improvement', 'optimization', 'consider', 'recommend'],
      low: ['minor', 'cosmetic', 'style', 'preference']
    };

    const text = response.toLowerCase();

    for (const [level, keywords] of Object.entries(severityKeywords)) {
      if (keywords.some(keyword => text.includes(keyword))) {
        return level;
      }
    }

    return 'medium';
  }

  isActionable(response) {
    const actionableKeywords = [
      'switch to', 'implement', 'use', 'configure', 'upgrade',
      'add', 'remove', 'replace', 'consider', 'migrate'
    ];

    return actionableKeywords.some(keyword =>
      response.toLowerCase().includes(keyword)
    );
  }

  generateChallengeSummary(challenges) {
    const summary = {
      totalChallenges: 0,
      severityDistribution: { high: 0, medium: 0, low: 0 },
      actionablePercentage: 0,
      topDomains: [],
      criticalFindings: []
    };

    let actionableCount = 0;

    for (const domainChallenge of challenges) {
      summary.totalChallenges += domainChallenge.results.length;

      for (const result of domainChallenge.results) {
        summary.severityDistribution[result.severity]++;
        if (result.actionable) actionableCount++;

        if (result.severity === 'high') {
          summary.criticalFindings.push({
            domain: domainChallenge.domain,
            challenge: result.response.substring(0, 150) + '...'
          });
        }
      }
    }

    summary.actionablePercentage = Math.round((actionableCount / summary.totalChallenges) * 100);

    // Identifier les domaines avec le plus de challenges high/medium
    summary.topDomains = challenges
      .map(c => ({
        domain: c.domain,
        criticalCount: c.results.filter(r => r.severity === 'high').length
      }))
      .sort((a, b) => b.criticalCount - a.criticalCount)
      .slice(0, 3);

    return summary;
  }

  extractActionItems(challenges) {
    const actionItems = [];

    for (const domainChallenge of challenges) {
      for (const result of domainChallenge.results) {
        if (result.actionable && result.severity !== 'low') {
          actionItems.push({
            domain: domainChallenge.domain,
            priority: result.severity === 'high' ? 1 : 2,
            action: result.response,
            llmSource: result.llm,
            estimatedEffort: this.estimateEffort(result.response)
          });
        }
      }
    }

    return actionItems
      .sort((a, b) => a.priority - b.priority)
      .slice(0, 10); // Top 10 actions
  }

  estimateEffort(action) {
    const effortKeywords = {
      high: ['migrate', 'rewrite', 'redesign', 'refactor all'],
      medium: ['implement', 'configure', 'setup', 'integrate'],
      low: ['update', 'upgrade', 'switch', 'add']
    };

    const text = action.toLowerCase();

    for (const [effort, keywords] of Object.entries(effortKeywords)) {
      if (keywords.some(keyword => text.includes(keyword))) {
        return effort;
      }
    }

    return 'medium';
  }

  displayResults(results) {
    console.log('\n' + '='.repeat(60));
    console.log('🎯 LLM CHALLENGE SESSION RESULTS');
    console.log('='.repeat(60));

    console.log(`\n📊 Summary:`);
    console.log(`   Total Challenges: ${results.summary.totalChallenges}`);
    console.log(`   Severity: High(${results.summary.severityDistribution.high}) Medium(${results.summary.severityDistribution.medium}) Low(${results.summary.severityDistribution.low})`);
    console.log(`   Actionable: ${results.summary.actionablePercentage}%`);

    if (results.summary.criticalFindings.length > 0) {
      console.log(`\n🚨 Critical Findings:`);
      results.summary.criticalFindings.forEach((finding, i) => {
        console.log(`   ${i + 1}. [${finding.domain}] ${finding.challenge}`);
      });
    }

    if (results.actionItems.length > 0) {
      console.log(`\n📋 Top Action Items:`);
      results.actionItems.slice(0, 5).forEach((item, i) => {
        const priority = item.priority === 1 ? '🔴' : '🟡';
        console.log(`   ${priority} [${item.domain}] ${item.action.substring(0, 80)}...`);
      });
    }

    console.log(`\n💡 Recommendation: Review ${results.summary.topDomains[0]?.domain || 'architecture'} domain first`);
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// CLI Interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const options = {
    dryRun: args.includes('--dry-run'),
    workspaceRoot: process.cwd()
  };

  const domain = args.find(arg => arg.startsWith('--domain='))?.split('=')[1] || 'all';
  const llms = args.find(arg => arg.startsWith('--llms='))?.split('=')[1]?.split(',') || ['claude'];

  const challenger = new LLMChallenger(options);

  challenger.runChallengeSession(domain, llms)
    .then(results => {
      console.log('\n✅ Challenge session completed');
      if (!options.dryRun) {
        console.log(`📁 Results saved in: ${challenger.outputDir}`);
      }
    })
    .catch(error => {
      console.error('❌ Challenge session failed:', error);
      process.exit(1);
    });
}

module.exports = LLMChallenger;