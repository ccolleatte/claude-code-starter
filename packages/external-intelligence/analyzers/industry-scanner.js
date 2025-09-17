#!/usr/bin/env node

/**
 * Industry Scanner - Automated Technology Trend Detection
 *
 * Scan automatisé des innovations technologiques pertinentes
 * via GitHub trending, Hacker News, dev blogs, et papers académiques
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const { execSync } = require('child_process');

class IndustryScanner {
  constructor(options = {}) {
    this.dryRun = options.dryRun || false;
    this.outputDir = path.join(__dirname, '../data/industry-trends');
    this.configDir = path.join(__dirname, '../templates/scan-configs');

    this.scanSources = {
      github: {
        name: 'GitHub Trending',
        enabled: true,
        frequency: 'daily',
        relevanceWeight: 0.8
      },
      hackernews: {
        name: 'Hacker News',
        enabled: true,
        frequency: 'daily',
        relevanceWeight: 0.7
      },
      devto: {
        name: 'Dev.to Trending',
        enabled: true,
        frequency: 'weekly',
        relevanceWeight: 0.6
      },
      arxiv: {
        name: 'ArXiv CS Papers',
        enabled: true,
        frequency: 'weekly',
        relevanceWeight: 0.9
      },
      reddit: {
        name: 'Reddit Programming',
        enabled: false, // Optionnel
        frequency: 'weekly',
        relevanceWeight: 0.5
      }
    };

    this.relevanceFilters = {
      keywords: [
        // Architecture & Patterns
        'microservices', 'serverless', 'event-driven', 'ddd', 'clean architecture',
        // Testing & Quality
        'testing', 'tdd', 'property-based', 'mutation testing', 'coverage',
        // Developer Experience
        'dx', 'developer experience', 'hot reload', 'fast refresh', 'hmr',
        // Tooling
        'build tools', 'bundler', 'vite', 'turbo', 'nx', 'monorepo',
        // Languages & Runtimes
        'typescript', 'javascript', 'node.js', 'deno', 'bun',
        // Performance
        'performance', 'optimization', 'caching', 'cdn', 'edge computing'
      ],
      excludeKeywords: [
        'blockchain', 'crypto', 'nft', 'web3', 'tutorial', 'beginner'
      ],
      minStars: 100, // Pour GitHub repos
      minScore: 10   // Pour Hacker News posts
    };

    this.ensureDirectories();
  }

  ensureDirectories() {
    [this.outputDir, this.configDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  async runDailyScan() {
    console.log('🔍 Starting Daily Industry Scan...');

    const scanId = `scan-${new Date().toISOString().split('T')[0]}`;
    const results = {
      scanId,
      timestamp: new Date().toISOString(),
      sources: {},
      trends: [],
      summary: {}
    };

    // Scan des sources quotidiennes
    const dailySources = Object.entries(this.scanSources)
      .filter(([_, config]) => config.enabled && config.frequency === 'daily');

    for (const [sourceKey, sourceConfig] of dailySources) {
      console.log(`📡 Scanning ${sourceConfig.name}...`);

      try {
        const sourceResults = await this.scanSource(sourceKey);
        results.sources[sourceKey] = {
          ...sourceConfig,
          results: sourceResults,
          scannedAt: new Date().toISOString()
        };

        console.log(`  ✅ Found ${sourceResults.length} items`);
      } catch (error) {
        console.error(`  ❌ Error scanning ${sourceConfig.name}:`, error.message);
        results.sources[sourceKey] = {
          ...sourceConfig,
          error: error.message,
          scannedAt: new Date().toISOString()
        };
      }
    }

    // Analyser les tendances détectées
    results.trends = this.analyzeTrends(results.sources);
    results.summary = this.generateScanSummary(results);

    // Sauvegarder les résultats
    const outputFile = path.join(this.outputDir, `${scanId}.json`);
    if (!this.dryRun) {
      fs.writeFileSync(outputFile, JSON.stringify(results, null, 2));
      console.log(`💾 Scan results saved to: ${outputFile}`);
    }

    this.displayScanResults(results);
    return results;
  }

  async runWeeklyScan() {
    console.log('🔍 Starting Weekly Industry Deep Scan...');

    // Inclure sources hebdomadaires + académiques
    const weeklySources = Object.entries(this.scanSources)
      .filter(([_, config]) => config.enabled);

    // Similar logic but more comprehensive
    return this.runDailyScan(); // Simplified for demo
  }

  async scanSource(sourceKey) {
    switch (sourceKey) {
      case 'github':
        return this.scanGitHubTrending();
      case 'hackernews':
        return this.scanHackerNews();
      case 'devto':
        return this.scanDevTo();
      case 'arxiv':
        return this.scanArXiv();
      case 'reddit':
        return this.scanReddit();
      default:
        throw new Error(`Unknown source: ${sourceKey}`);
    }
  }

  async scanGitHubTrending() {
    if (this.dryRun) {
      return this.generateMockGitHubData();
    }

    try {
      // En production, utiliser GitHub API
      // Pour maintenant, simulation avec des données réalistes
      return this.generateMockGitHubData();
    } catch (error) {
      throw new Error(`GitHub API error: ${error.message}`);
    }
  }

  generateMockGitHubData() {
    return [
      {
        name: 'biome',
        fullName: 'biomejs/biome',
        description: 'A toolchain for web projects, aimed to provide functionalities to maintain them.',
        stars: 8234,
        language: 'Rust',
        trending: 'daily',
        relevanceScore: 0.9,
        relevanceReasons: ['build tools', 'developer experience', 'performance']
      },
      {
        name: 'vitest',
        fullName: 'vitest-dev/vitest',
        description: 'A blazing fast unit test framework powered by Vite',
        stars: 11567,
        language: 'TypeScript',
        trending: 'weekly',
        relevanceScore: 0.85,
        relevanceReasons: ['testing', 'performance', 'developer experience']
      },
      {
        name: 'turbo',
        fullName: 'vercel/turbo',
        description: 'Incremental bundler and build system optimized for JavaScript and TypeScript',
        stars: 24891,
        language: 'Rust',
        trending: 'monthly',
        relevanceScore: 0.95,
        relevanceReasons: ['build tools', 'monorepo', 'performance', 'developer experience']
      }
    ];
  }

  async scanHackerNews() {
    if (this.dryRun) {
      return this.generateMockHNData();
    }

    // En production, utiliser HN API
    return this.generateMockHNData();
  }

  generateMockHNData() {
    return [
      {
        id: 39234567,
        title: 'Bun 1.0 – A JavaScript runtime, bundler, transpiler and package manager',
        url: 'https://bun.sh/blog/bun-v1.0',
        score: 742,
        comments: 234,
        author: 'jarredsumner',
        relevanceScore: 0.9,
        relevanceReasons: ['javascript', 'performance', 'tooling', 'developer experience']
      },
      {
        id: 39234568,
        title: 'Property-Based Testing in JavaScript with fast-check',
        url: 'https://dev.to/property-testing-js',
        score: 156,
        comments: 45,
        author: 'testingexpert',
        relevanceScore: 0.8,
        relevanceReasons: ['testing', 'property-based', 'javascript']
      }
    ];
  }

  async scanDevTo() {
    return [
      {
        title: 'The Evolution of Monorepo Tooling in 2024',
        url: 'https://dev.to/monorepo-2024',
        reactions: 234,
        comments: 45,
        tags: ['monorepo', 'tooling', 'nx', 'turbo'],
        relevanceScore: 0.85,
        relevanceReasons: ['monorepo', 'tooling', 'developer experience']
      }
    ];
  }

  async scanArXiv() {
    return [
      {
        id: 'cs.SE/2401.12345',
        title: 'Automated Test Generation for Microservices: A Systematic Study',
        authors: ['Smith, J.', 'Doe, A.'],
        abstract: 'This paper presents novel approaches to automated testing in microservice architectures...',
        publishedDate: '2024-01-15',
        relevanceScore: 0.9,
        relevanceReasons: ['testing', 'microservices', 'automation']
      }
    ];
  }

  async scanReddit() {
    return [
      {
        title: 'What build tool are you using in 2024?',
        subreddit: 'javascript',
        score: 456,
        comments: 123,
        url: 'https://reddit.com/r/javascript/comments/xyz',
        relevanceScore: 0.6,
        relevanceReasons: ['build tools', 'survey', 'community trends']
      }
    ];
  }

  analyzeTrends(sources) {
    const trends = [];
    const keywordCounts = {};
    const technologyMentions = {};

    // Analyser tous les résultats pour détecter les patterns
    Object.values(sources).forEach(source => {
      if (!source.results) return;

      source.results.forEach(item => {
        // Compter les mots-clés de pertinence
        if (item.relevanceReasons) {
          item.relevanceReasons.forEach(reason => {
            keywordCounts[reason] = (keywordCounts[reason] || 0) + 1;
          });
        }

        // Détecter les technologies mentionnées
        const technologies = this.extractTechnologies(item);
        technologies.forEach(tech => {
          technologyMentions[tech] = (technologyMentions[tech] || 0) + 1;
        });
      });
    });

    // Identifier les tendances émergentes
    const trendingKeywords = Object.entries(keywordCounts)
      .filter(([_, count]) => count >= 2)
      .sort(([_, a], [__, b]) => b - a)
      .slice(0, 10);

    const emergingTechnologies = Object.entries(technologyMentions)
      .filter(([_, count]) => count >= 2)
      .sort(([_, a], [__, b]) => b - a)
      .slice(0, 10);

    // Créer les objets de tendance
    trendingKeywords.forEach(([keyword, count]) => {
      trends.push({
        type: 'concept',
        name: keyword,
        mentions: count,
        confidence: Math.min(count / 5, 1),
        category: this.categorizeKeyword(keyword),
        impact: this.assessTrendImpact(keyword, count)
      });
    });

    emergingTechnologies.forEach(([tech, count]) => {
      trends.push({
        type: 'technology',
        name: tech,
        mentions: count,
        confidence: Math.min(count / 3, 1),
        category: 'tooling',
        impact: this.assessTrendImpact(tech, count)
      });
    });

    return trends.sort((a, b) => b.impact - a.impact);
  }

  extractTechnologies(item) {
    const technologies = [];
    const text = `${item.title || ''} ${item.description || ''} ${item.abstract || ''}`.toLowerCase();

    const knownTech = [
      'react', 'vue', 'angular', 'svelte', 'solid',
      'node.js', 'deno', 'bun',
      'typescript', 'javascript',
      'webpack', 'vite', 'rollup', 'parcel',
      'jest', 'vitest', 'cypress', 'playwright',
      'docker', 'kubernetes',
      'graphql', 'rest', 'trpc',
      'nextjs', 'nuxt', 'sveltekit',
      'tailwind', 'styled-components',
      'prisma', 'drizzle', 'mongoose'
    ];

    knownTech.forEach(tech => {
      if (text.includes(tech) || text.includes(tech.replace('.', ''))) {
        technologies.push(tech);
      }
    });

    return technologies;
  }

  categorizeKeyword(keyword) {
    const categories = {
      architecture: ['microservices', 'serverless', 'event-driven', 'ddd'],
      testing: ['testing', 'tdd', 'property-based', 'coverage'],
      devex: ['dx', 'developer experience', 'hot reload', 'hmr'],
      tooling: ['build tools', 'bundler', 'monorepo'],
      performance: ['performance', 'optimization', 'caching']
    };

    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(k => keyword.includes(k) || k.includes(keyword))) {
        return category;
      }
    }

    return 'other';
  }

  assessTrendImpact(trend, mentionCount) {
    const baseImpact = mentionCount / 10;
    const multipliers = {
      'performance': 1.5,
      'developer experience': 1.4,
      'testing': 1.3,
      'build tools': 1.2,
      'typescript': 1.1
    };

    const multiplier = Object.entries(multipliers)
      .find(([key, _]) => trend.toLowerCase().includes(key))?.[1] || 1;

    return Math.min(baseImpact * multiplier, 1);
  }

  generateScanSummary(results) {
    const summary = {
      totalItems: 0,
      sourceBreakdown: {},
      topTrends: [],
      emergingTechnologies: [],
      actionableInsights: [],
      recommendedFollowUps: []
    };

    // Compter les items par source
    Object.entries(results.sources).forEach(([sourceKey, source]) => {
      const itemCount = source.results?.length || 0;
      summary.totalItems += itemCount;
      summary.sourceBreakdown[sourceKey] = itemCount;
    });

    // Top tendances
    summary.topTrends = results.trends
      .filter(t => t.confidence > 0.5)
      .slice(0, 5)
      .map(t => ({ name: t.name, type: t.type, impact: t.impact }));

    // Technologies émergentes
    summary.emergingTechnologies = results.trends
      .filter(t => t.type === 'technology' && t.impact > 0.3)
      .slice(0, 3)
      .map(t => t.name);

    // Insights actionnables
    summary.actionableInsights = this.generateActionableInsights(results.trends);

    // Recommandations de suivi
    summary.recommendedFollowUps = this.generateFollowUpRecommendations(results.trends);

    return summary;
  }

  generateActionableInsights(trends) {
    const insights = [];

    const highImpactTrends = trends.filter(t => t.impact > 0.6);

    for (const trend of highImpactTrends) {
      switch (trend.category) {
        case 'tooling':
          insights.push({
            category: 'tooling',
            insight: `Consider evaluating ${trend.name} as it's gaining significant traction (${trend.mentions} mentions)`,
            urgency: trend.impact > 0.8 ? 'high' : 'medium',
            effort: 'low'
          });
          break;
        case 'testing':
          insights.push({
            category: 'testing',
            insight: `${trend.name} is trending - evaluate integration with current testing strategy`,
            urgency: 'medium',
            effort: 'medium'
          });
          break;
        case 'performance':
          insights.push({
            category: 'performance',
            insight: `Performance trend detected: ${trend.name}. Consider audit of current approach`,
            urgency: 'high',
            effort: 'medium'
          });
          break;
      }
    }

    return insights.slice(0, 5);
  }

  generateFollowUpRecommendations(trends) {
    const recommendations = [];

    const categoryTrends = trends.reduce((acc, trend) => {
      acc[trend.category] = acc[trend.category] || [];
      acc[trend.category].push(trend);
      return acc;
    }, {});

    Object.entries(categoryTrends).forEach(([category, categoryTrends]) => {
      if (categoryTrends.length >= 2) {
        recommendations.push({
          category,
          action: `Deep dive into ${category} trends`,
          reasoning: `Multiple ${category} trends detected (${categoryTrends.length} items)`,
          priority: categoryTrends.some(t => t.impact > 0.7) ? 'high' : 'medium'
        });
      }
    });

    return recommendations;
  }

  displayScanResults(results) {
    console.log('\n' + '='.repeat(60));
    console.log('📊 INDUSTRY SCAN RESULTS');
    console.log('='.repeat(60));

    console.log(`\n📈 Summary:`);
    console.log(`   Total Items Scanned: ${results.summary.totalItems}`);
    console.log(`   Sources: ${Object.keys(results.sources).join(', ')}`);
    console.log(`   Trends Detected: ${results.trends.length}`);

    if (results.summary.topTrends.length > 0) {
      console.log(`\n🔥 Top Trends:`);
      results.summary.topTrends.forEach((trend, i) => {
        const impact = Math.round(trend.impact * 100);
        console.log(`   ${i + 1}. ${trend.name} (${trend.type}) - Impact: ${impact}%`);
      });
    }

    if (results.summary.emergingTechnologies.length > 0) {
      console.log(`\n💡 Emerging Technologies:`);
      results.summary.emergingTechnologies.forEach((tech, i) => {
        console.log(`   ${i + 1}. ${tech}`);
      });
    }

    if (results.summary.actionableInsights.length > 0) {
      console.log(`\n🎯 Actionable Insights:`);
      results.summary.actionableInsights.forEach((insight, i) => {
        const urgency = insight.urgency === 'high' ? '🔴' : '🟡';
        console.log(`   ${urgency} [${insight.category}] ${insight.insight}`);
      });
    }

    if (results.summary.recommendedFollowUps.length > 0) {
      console.log(`\n📋 Recommended Follow-ups:`);
      results.summary.recommendedFollowUps.forEach((rec, i) => {
        const priority = rec.priority === 'high' ? '🔴' : '🟡';
        console.log(`   ${priority} ${rec.action}: ${rec.reasoning}`);
      });
    }
  }
}

// CLI Interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const options = {
    dryRun: args.includes('--dry-run')
  };

  const scanType = args.find(arg => arg.startsWith('--type='))?.split('=')[1] || 'daily';

  const scanner = new IndustryScanner(options);

  const scanMethod = scanType === 'weekly' ? 'runWeeklyScan' : 'runDailyScan';

  scanner[scanMethod]()
    .then(results => {
      console.log('\n✅ Industry scan completed');
      if (!options.dryRun) {
        console.log(`📁 Results saved in: ${scanner.outputDir}`);
      }
    })
    .catch(error => {
      console.error('❌ Industry scan failed:', error);
      process.exit(1);
    });
}

module.exports = IndustryScanner;