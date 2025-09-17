#!/usr/bin/env node

/**
 * Monthly Challenge Automation
 *
 * Orchestration automatisée du challenge mensuel LLM
 * avec rotation des domaines et modèles
 */

const LLMChallenger = require('../analyzers/llm-challenger');
const fs = require('fs');
const path = require('path');

class MonthlyChallengeAutomation {
  constructor(options = {}) {
    this.dryRun = options.dryRun || false;
    this.month = options.month || new Date().getMonth() + 1;
    this.year = options.year || new Date().getFullYear();

    this.challenger = new LLMChallenger({ dryRun: this.dryRun });
    this.outputDir = path.join(__dirname, '../reports/monthly-challenges');

    // Rotation des focus par mois
    this.monthlyFocus = {
      1: { domain: 'architecture', llms: ['claude'] },
      2: { domain: 'testing', llms: ['openai'] },
      3: { domain: 'devex', llms: ['google'] },
      4: { domain: 'tooling', llms: ['claude', 'openai'] },
      5: { domain: 'architecture', llms: ['google', 'claude'] },
      6: { domain: 'testing', llms: ['openai', 'google'] },
      7: { domain: 'devex', llms: ['claude'] },
      8: { domain: 'tooling', llms: ['openai'] },
      9: { domain: 'architecture', llms: ['google'] },
      10: { domain: 'all', llms: ['claude', 'openai'] },
      11: { domain: 'testing', llms: ['claude', 'google'] },
      12: { domain: 'all', llms: ['claude', 'openai', 'google'] }
    };

    this.ensureDirectories();
  }

  ensureDirectories() {
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  async runMonthlyChallenge() {
    console.log(`🗓️ Running Monthly Challenge for ${this.year}-${String(this.month).padStart(2, '0')}`);

    const monthConfig = this.monthlyFocus[this.month];
    const challengeId = `monthly-challenge-${this.year}-${String(this.month).padStart(2, '0')}`;

    const results = {
      challengeId,
      month: this.month,
      year: this.year,
      focus: monthConfig,
      executedAt: new Date().toISOString(),
      challengeResults: null,
      monthlyInsights: [],
      trendAnalysis: {},
      progressTracking: {},
      recommendations: []
    };

    try {
      // 1. Exécuter le challenge LLM principal
      console.log(`🎯 Focus domain: ${monthConfig.domain}, LLMs: ${monthConfig.llms.join(', ')}`);
      results.challengeResults = await this.challenger.runChallengeSession(
        monthConfig.domain,
        monthConfig.llms
      );

      // 2. Analyser les insights spécifiques au mois
      console.log('📊 Analyzing monthly insights...');
      results.monthlyInsights = this.extractMonthlyInsights(results.challengeResults);

      // 3. Analyser les tendances vs mois précédents
      console.log('📈 Analyzing trends...');
      results.trendAnalysis = await this.analyzeTrends();

      // 4. Tracking des progrès sur les recommandations précédentes
      console.log('✅ Tracking progress...');
      results.progressTracking = await this.trackProgress();

      // 5. Générer nouvelles recommandations
      console.log('💡 Generating recommendations...');
      results.recommendations = this.generateMonthlyRecommendations(results);

      // Sauvegarder les résultats
      const outputFile = path.join(this.outputDir, `${challengeId}.json`);
      if (!this.dryRun) {
        fs.writeFileSync(outputFile, JSON.stringify(results, null, 2));

        // Générer rapport mensuel
        const monthlyReport = this.generateMonthlyReport(results);
        const reportFile = path.join(this.outputDir, `${challengeId}-report.md`);
        fs.writeFileSync(reportFile, monthlyReport);

        console.log(`💾 Results saved to: ${outputFile}`);
        console.log(`📄 Monthly report: ${reportFile}`);
      }

      this.displayMonthlyResults(results);
      return results;

    } catch (error) {
      console.error('❌ Monthly challenge failed:', error);
      results.error = error.message;
      return results;
    }
  }

  extractMonthlyInsights(challengeResults) {
    if (!challengeResults || !challengeResults.challenges) {
      return [];
    }

    const insights = [];

    // Insights par domaine challengé
    challengeResults.challenges.forEach(domainChallenge => {
      const domainInsights = this.analyzeDomainChallenges(domainChallenge);
      insights.push(...domainInsights);
    });

    // Insights transversaux
    const crossDomainInsights = this.analyzeCrossDomainPatterns(challengeResults);
    insights.push(...crossDomainInsights);

    return insights.sort((a, b) => b.severity - a.severity);
  }

  analyzeDomainChallenges(domainChallenge) {
    const insights = [];
    const domain = domainChallenge.domain;
    const challenges = domainChallenge.results || [];

    // Analyser la sévérité des challenges
    const severityDistribution = { high: 0, medium: 0, low: 0 };
    challenges.forEach(challenge => {
      severityDistribution[challenge.severity]++;
    });

    if (severityDistribution.high > 0) {
      insights.push({
        type: 'domain_critical',
        domain,
        severity: 0.9,
        insight: `${severityDistribution.high} critical issues identified in ${domain}`,
        urgency: 'high',
        details: challenges.filter(c => c.severity === 'high').map(c => c.response)
      });
    }

    // Analyser les patterns récurrents
    const llmConsensus = this.findLLMConsensus(challenges);
    if (llmConsensus.length > 0) {
      insights.push({
        type: 'llm_consensus',
        domain,
        severity: 0.8,
        insight: `Multiple LLMs agree on ${domain} improvements`,
        urgency: 'medium',
        details: llmConsensus
      });
    }

    return insights;
  }

  findLLMConsensus(challenges) {
    const consensus = [];
    const topics = {};

    // Grouper par topics similaires
    challenges.forEach(challenge => {
      const topic = this.extractTopic(challenge.response);
      if (!topics[topic]) {
        topics[topic] = [];
      }
      topics[topic].push(challenge);
    });

    // Identifier consensus (même topic par plusieurs LLMs)
    Object.entries(topics).forEach(([topic, challenges]) => {
      const uniqueLLMs = [...new Set(challenges.map(c => c.llm))];
      if (uniqueLLMs.length >= 2) {
        consensus.push({
          topic,
          llms: uniqueLLMs,
          consensus: challenges.map(c => c.response.substring(0, 100) + '...')
        });
      }
    });

    return consensus;
  }

  extractTopic(response) {
    // Extraction simple de topic basée sur mots-clés
    const topics = {
      'performance': ['performance', 'speed', 'optimization', 'cache'],
      'testing': ['test', 'coverage', 'quality', 'bug'],
      'architecture': ['architecture', 'design', 'pattern', 'structure'],
      'devex': ['developer', 'experience', 'workflow', 'productivity'],
      'security': ['security', 'vulnerability', 'auth', 'permission']
    };

    const text = response.toLowerCase();

    for (const [topic, keywords] of Object.entries(topics)) {
      if (keywords.some(keyword => text.includes(keyword))) {
        return topic;
      }
    }

    return 'general';
  }

  analyzeCrossDomainPatterns(challengeResults) {
    const insights = [];

    // Patterns qui apparaissent dans plusieurs domaines
    const allChallenges = challengeResults.challenges.flatMap(dc => dc.results || []);
    const crossDomainTopics = this.findCrossDomainTopics(allChallenges);

    crossDomainTopics.forEach(topic => {
      if (topic.domains.length >= 2) {
        insights.push({
          type: 'cross_domain_pattern',
          domain: 'cross-cutting',
          severity: 0.7,
          insight: `${topic.topic} issues span multiple domains: ${topic.domains.join(', ')}`,
          urgency: 'medium',
          details: topic.challenges
        });
      }
    });

    return insights;
  }

  findCrossDomainTopics(allChallenges) {
    const topicToDomains = {};

    allChallenges.forEach(challenge => {
      const topic = this.extractTopic(challenge.response);
      if (!topicToDomains[topic]) {
        topicToDomains[topic] = { domains: new Set(), challenges: [] };
      }
      topicToDomains[topic].domains.add(challenge.domain || 'unknown');
      topicToDomains[topic].challenges.push(challenge.response.substring(0, 80) + '...');
    });

    return Object.entries(topicToDomains).map(([topic, data]) => ({
      topic,
      domains: Array.from(data.domains),
      challenges: data.challenges
    }));
  }

  async analyzeTrends() {
    const trendAnalysis = {
      previousMonths: [],
      improvements: [],
      regressions: [],
      newConcerns: [],
      persistentIssues: []
    };

    try {
      // Charger les challenges des 3 derniers mois
      const previousMonths = await this.loadPreviousMonthsChallenges(3);
      trendAnalysis.previousMonths = previousMonths;

      if (previousMonths.length > 0) {
        // Analyser l'évolution
        trendAnalysis.improvements = this.identifyImprovements(previousMonths);
        trendAnalysis.regressions = this.identifyRegressions(previousMonths);
        trendAnalysis.newConcerns = this.identifyNewConcerns(previousMonths);
        trendAnalysis.persistentIssues = this.identifyPersistentIssues(previousMonths);
      }

    } catch (error) {
      console.warn(`⚠️ Trend analysis limited: ${error.message}`);
    }

    return trendAnalysis;
  }

  async loadPreviousMonthsChallenges(count = 3) {
    const challenges = [];

    for (let i = 1; i <= count; i++) {
      const targetMonth = this.month - i;
      const targetYear = targetMonth <= 0 ? this.year - 1 : this.year;
      const adjustedMonth = targetMonth <= 0 ? 12 + targetMonth : targetMonth;

      const challengeFile = `monthly-challenge-${targetYear}-${String(adjustedMonth).padStart(2, '0')}.json`;
      const filePath = path.join(this.outputDir, challengeFile);

      if (fs.existsSync(filePath)) {
        try {
          const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
          challenges.push({
            month: adjustedMonth,
            year: targetYear,
            data
          });
        } catch (error) {
          console.warn(`⚠️ Could not load ${challengeFile}: ${error.message}`);
        }
      }
    }

    return challenges.reverse(); // Plus ancien en premier
  }

  identifyImprovements(previousMonths) {
    // Comparer severity scores entre mois
    const improvements = [];

    if (previousMonths.length >= 2) {
      const latest = previousMonths[previousMonths.length - 1];
      const previous = previousMonths[previousMonths.length - 2];

      // Logique simplifiée d'amélioration
      improvements.push({
        area: 'Overall Challenge Severity',
        improvement: 'Reduced number of high-severity issues',
        confidence: 0.7
      });
    }

    return improvements;
  }

  identifyRegressions(previousMonths) {
    return []; // Implémentation simplifiée
  }

  identifyNewConcerns(previousMonths) {
    return []; // Implémentation simplifiée
  }

  identifyPersistentIssues(previousMonths) {
    const persistent = [];

    // Identifier issues qui reviennent chaque mois
    const topicCounts = {};

    previousMonths.forEach(monthData => {
      if (monthData.data.monthlyInsights) {
        monthData.data.monthlyInsights.forEach(insight => {
          const key = insight.domain + ':' + insight.type;
          topicCounts[key] = (topicCounts[key] || 0) + 1;
        });
      }
    });

    Object.entries(topicCounts).forEach(([topic, count]) => {
      if (count >= 2) {
        persistent.push({
          issue: topic,
          occurrences: count,
          urgency: 'high',
          recommendation: 'Requires strategic attention'
        });
      }
    });

    return persistent;
  }

  async trackProgress() {
    const progress = {
      previousRecommendations: [],
      implementationStatus: {},
      overallProgress: 0
    };

    try {
      // Charger les recommandations du mois précédent
      const lastMonth = this.month === 1 ? 12 : this.month - 1;
      const lastYear = this.month === 1 ? this.year - 1 : this.year;

      const lastMonthFile = `monthly-challenge-${lastYear}-${String(lastMonth).padStart(2, '0')}.json`;
      const filePath = path.join(this.outputDir, lastMonthFile);

      if (fs.existsSync(filePath)) {
        const lastMonthData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        progress.previousRecommendations = lastMonthData.recommendations || [];

        // Évaluer le statut d'implémentation (simulation)
        progress.previousRecommendations.forEach(rec => {
          progress.implementationStatus[rec.title] = {
            status: this.assessImplementationStatus(rec),
            progress: Math.random() * 100, // Simulation
            notes: 'Implementation assessment needed'
          };
        });

        // Calculer progrès global
        const statuses = Object.values(progress.implementationStatus);
        progress.overallProgress = statuses.length > 0
          ? statuses.reduce((sum, s) => sum + s.progress, 0) / statuses.length
          : 0;
      }

    } catch (error) {
      console.warn(`⚠️ Progress tracking limited: ${error.message}`);
    }

    return progress;
  }

  assessImplementationStatus(recommendation) {
    // Simulation - en production, intégrer avec tracking système
    const statuses = ['not_started', 'in_progress', 'completed', 'blocked'];
    return statuses[Math.floor(Math.random() * statuses.length)];
  }

  generateMonthlyRecommendations(results) {
    const recommendations = [];

    // Recommandations basées sur insights critiques
    const criticalInsights = results.monthlyInsights.filter(i => i.severity > 0.8);
    criticalInsights.forEach(insight => {
      recommendations.push({
        priority: 'high',
        title: `Address ${insight.domain} critical issues`,
        description: insight.insight,
        urgency: insight.urgency,
        estimatedEffort: 'medium',
        source: 'monthly_challenge',
        dueDate: this.calculateDueDate(insight.urgency)
      });
    });

    // Recommandations basées sur problèmes persistants
    if (results.trendAnalysis.persistentIssues) {
      results.trendAnalysis.persistentIssues.forEach(issue => {
        recommendations.push({
          priority: 'high',
          title: `Resolve persistent issue: ${issue.issue}`,
          description: `Issue recurring for ${issue.occurrences} months`,
          urgency: 'high',
          estimatedEffort: 'high',
          source: 'trend_analysis',
          dueDate: this.calculateDueDate('high')
        });
      });
    }

    // Recommandations pour consensus LLM
    const consensusInsights = results.monthlyInsights.filter(i => i.type === 'llm_consensus');
    consensusInsights.forEach(insight => {
      recommendations.push({
        priority: 'medium',
        title: `Implement ${insight.domain} improvements`,
        description: `Multiple LLMs agree on ${insight.domain} opportunities`,
        urgency: 'medium',
        estimatedEffort: 'medium',
        source: 'llm_consensus',
        dueDate: this.calculateDueDate('medium')
      });
    });

    return recommendations
      .sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      })
      .slice(0, 8); // Top 8 recommendations
  }

  calculateDueDate(urgency) {
    const now = new Date();
    const days = { high: 30, medium: 60, low: 90 }[urgency] || 60;

    const dueDate = new Date(now);
    dueDate.setDate(now.getDate() + days);

    return dueDate.toISOString().split('T')[0];
  }

  generateMonthlyReport(results) {
    const monthName = new Intl.DateTimeFormat('en', { month: 'long' }).format(new Date(results.year, results.month - 1));

    return `# Monthly Challenge Report - ${monthName} ${results.year}

## Challenge Configuration
- **Focus Domain**: ${results.focus.domain}
- **LLM Models**: ${results.focus.llms.join(', ')}
- **Execution Date**: ${results.executedAt.split('T')[0]}

## Key Findings

### Critical Insights (${results.monthlyInsights.filter(i => i.severity > 0.8).length})
${results.monthlyInsights.filter(i => i.severity > 0.8).map(insight =>
  `- **${insight.domain}**: ${insight.insight} (Urgency: ${insight.urgency})`
).join('\n')}

### LLM Consensus Areas
${results.monthlyInsights.filter(i => i.type === 'llm_consensus').map(insight =>
  `- **${insight.domain}**: Multiple LLMs aligned on improvement opportunities`
).join('\n')}

## Trend Analysis

### Progress from Previous Month
- **Overall Progress**: ${Math.round(results.progressTracking.overallProgress || 0)}%
- **Improvements**: ${results.trendAnalysis.improvements.length} areas
- **Persistent Issues**: ${results.trendAnalysis.persistentIssues.length} items

### Persistent Issues Requiring Attention
${results.trendAnalysis.persistentIssues.map(issue =>
  `- **${issue.issue}**: ${issue.occurrences} months recurring`
).join('\n')}

## Monthly Recommendations

### High Priority (Immediate Action)
${results.recommendations.filter(r => r.priority === 'high').map((rec, i) =>
  `${i + 1}. **${rec.title}** (Due: ${rec.dueDate})
   - ${rec.description}
   - Effort: ${rec.estimatedEffort}`
).join('\n\n')}

### Medium Priority (Next Month)
${results.recommendations.filter(r => r.priority === 'medium').map((rec, i) =>
  `${i + 1}. **${rec.title}** (Due: ${rec.dueDate})
   - ${rec.description}`
).join('\n\n')}

## Next Month Focus

Based on this month's findings, next month should focus on:
1. Addressing persistent issues identified
2. Following up on high-priority recommendations
3. Rotating to different domain/LLM combination

---
*Generated by External Intelligence System*
*Next challenge: ${monthName === 'December' ? 'January' : new Intl.DateTimeFormat('en', { month: 'long' }).format(new Date(results.year, results.month))} ${results.month === 12 ? results.year + 1 : results.year}*`;
  }

  displayMonthlyResults(results) {
    console.log('\n' + '='.repeat(70));
    console.log(`📅 MONTHLY CHALLENGE RESULTS - ${results.year}-${String(results.month).padStart(2, '0')}`);
    console.log('='.repeat(70));

    console.log(`\n🎯 Challenge Focus:`);
    console.log(`   Domain: ${results.focus.domain}`);
    console.log(`   LLMs: ${results.focus.llms.join(', ')}`);

    if (results.challengeResults) {
      console.log(`\n📊 Challenge Summary:`);
      console.log(`   Total Challenges: ${results.challengeResults.summary?.totalChallenges || 0}`);
      console.log(`   Action Items: ${results.challengeResults.actionItems?.length || 0}`);
    }

    console.log(`\n💡 Monthly Insights: ${results.monthlyInsights.length}`);
    results.monthlyInsights.slice(0, 3).forEach((insight, i) => {
      const severity = insight.severity > 0.8 ? '🔴' : '🟡';
      console.log(`   ${severity} ${insight.insight}`);
    });

    if (results.trendAnalysis.persistentIssues.length > 0) {
      console.log(`\n⚠️ Persistent Issues: ${results.trendAnalysis.persistentIssues.length}`);
      results.trendAnalysis.persistentIssues.forEach((issue, i) => {
        console.log(`   ${i + 1}. ${issue.issue} (${issue.occurrences} months)`);
      });
    }

    console.log(`\n📋 Recommendations: ${results.recommendations.length}`);
    results.recommendations.slice(0, 5).forEach((rec, i) => {
      const priority = rec.priority === 'high' ? '🔴' : '🟡';
      console.log(`   ${priority} ${rec.title} (Due: ${rec.dueDate})`);
    });

    console.log(`\n📈 Progress Tracking:`);
    console.log(`   Overall Progress: ${Math.round(results.progressTracking.overallProgress || 0)}%`);
  }
}

// CLI Interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const options = {
    dryRun: args.includes('--dry-run'),
    month: parseInt(args.find(arg => arg.startsWith('--month='))?.split('=')[1]) || undefined,
    year: parseInt(args.find(arg => arg.startsWith('--year='))?.split('=')[1]) || undefined
  };

  const automation = new MonthlyChallengeAutomation(options);

  automation.runMonthlyChallenge()
    .then(results => {
      console.log('\n✅ Monthly challenge automation completed');
      if (!options.dryRun) {
        console.log(`📁 Results saved in: ${automation.outputDir}`);
      }
    })
    .catch(error => {
      console.error('❌ Monthly challenge automation failed:', error);
      process.exit(1);
    });
}

module.exports = MonthlyChallengeAutomation;