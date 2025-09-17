#!/usr/bin/env node

/**
 * Daily Scan Automation
 *
 * Automatisation du scan quotidien des tendances industrie
 * avec notification des insights critiques
 */

const IndustryScanner = require('../analyzers/industry-scanner');
const fs = require('fs');
const path = require('path');

class DailyScanAutomation {
  constructor(options = {}) {
    this.dryRun = options.dryRun || false;
    this.date = options.date || new Date().toISOString().split('T')[0];

    this.scanner = new IndustryScanner({ dryRun: this.dryRun });
    this.outputDir = path.join(__dirname, '../data/daily-scans');
    this.alertsDir = path.join(__dirname, '../data/alerts');

    this.alertThresholds = {
      highImpactTrend: 0.8,
      emergingTechnology: 0.7,
      criticalInsight: 0.75,
      consensusSignal: 3 // Minimum mentions across sources
    };

    this.ensureDirectories();
  }

  ensureDirectories() {
    [this.outputDir, this.alertsDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  async runDailyScan() {
    console.log(`📅 Running Daily Scan for ${this.date}`);

    const scanId = `daily-scan-${this.date}`;
    const results = {
      scanId,
      date: this.date,
      executedAt: new Date().toISOString(),
      scanResults: null,
      alerts: [],
      insights: [],
      trendSignals: [],
      weeklyAggregation: {},
      recommendations: []
    };

    try {
      // 1. Exécuter le scan industrie
      console.log('🔍 Scanning industry sources...');
      results.scanResults = await this.scanner.runDailyScan();

      // 2. Détecter les signaux d'alerte
      console.log('🚨 Detecting alert signals...');
      results.alerts = this.detectAlertSignals(results.scanResults);

      // 3. Extraire insights quotidiens
      console.log('💡 Extracting daily insights...');
      results.insights = this.extractDailyInsights(results.scanResults);

      // 4. Analyser signaux de tendance
      console.log('📈 Analyzing trend signals...');
      results.trendSignals = this.analyzeTrendSignals(results.scanResults);

      // 5. Agrégation hebdomadaire (si vendredi)
      if (this.isEndOfWeek()) {
        console.log('📊 Generating weekly aggregation...');
        results.weeklyAggregation = await this.generateWeeklyAggregation();
      }

      // 6. Recommandations d'action
      console.log('📋 Generating action recommendations...');
      results.recommendations = this.generateDailyRecommendations(results);

      // Sauvegarder les résultats
      const outputFile = path.join(this.outputDir, `${scanId}.json`);
      if (!this.dryRun) {
        fs.writeFileSync(outputFile, JSON.stringify(results, null, 2));

        // Sauvegarder alertes si critiques
        if (results.alerts.length > 0) {
          await this.saveAlerts(results.alerts);
        }

        console.log(`💾 Scan results saved to: ${outputFile}`);
      }

      this.displayDailyResults(results);
      return results;

    } catch (error) {
      console.error('❌ Daily scan failed:', error);
      results.error = error.message;
      return results;
    }
  }

  detectAlertSignals(scanResults) {
    const alerts = [];

    if (!scanResults || !scanResults.trends) {
      return alerts;
    }

    // Alert 1: High impact trends
    const highImpactTrends = scanResults.trends.filter(
      trend => trend.impact > this.alertThresholds.highImpactTrend
    );

    highImpactTrends.forEach(trend => {
      alerts.push({
        type: 'high_impact_trend',
        severity: 'high',
        title: `High-impact trend detected: ${trend.name}`,
        description: `Trend showing ${Math.round(trend.impact * 100)}% impact potential`,
        data: trend,
        actionRequired: true,
        timestamp: new Date().toISOString()
      });
    });

    // Alert 2: Emerging technologies with momentum
    const emergingTech = scanResults.trends.filter(
      trend => trend.type === 'technology' && trend.confidence > this.alertThresholds.emergingTechnology
    );

    emergingTech.forEach(tech => {
      alerts.push({
        type: 'emerging_technology',
        severity: 'medium',
        title: `Emerging technology: ${tech.name}`,
        description: `Technology gaining traction (confidence: ${Math.round(tech.confidence * 100)}%)`,
        data: tech,
        actionRequired: false,
        timestamp: new Date().toISOString()
      });
    });

    // Alert 3: Consensus signals across sources
    const consensusSignals = this.detectConsensusSignals(scanResults);
    consensusSignals.forEach(signal => {
      alerts.push({
        type: 'consensus_signal',
        severity: 'high',
        title: `Cross-source consensus: ${signal.topic}`,
        description: `${signal.sourceCount} sources mentioning ${signal.topic}`,
        data: signal,
        actionRequired: true,
        timestamp: new Date().toISOString()
      });
    });

    return alerts.sort((a, b) => {
      const severityOrder = { high: 3, medium: 2, low: 1 };
      return severityOrder[b.severity] - severityOrder[a.severity];
    });
  }

  detectConsensusSignals(scanResults) {
    const signals = [];

    if (!scanResults.sources) return signals;

    // Compter mentions par topic across sources
    const topicMentions = {};

    Object.values(scanResults.sources).forEach(source => {
      if (!source.results) return;

      source.results.forEach(item => {
        const topics = this.extractTopics(item);
        topics.forEach(topic => {
          if (!topicMentions[topic]) {
            topicMentions[topic] = { count: 0, sources: new Set(), items: [] };
          }
          topicMentions[topic].count++;
          topicMentions[topic].sources.add(source.name || 'unknown');
          topicMentions[topic].items.push(item);
        });
      });
    });

    // Identifier consensus (mention dans plusieurs sources)
    Object.entries(topicMentions).forEach(([topic, data]) => {
      if (data.sources.size >= this.alertThresholds.consensusSignal) {
        signals.push({
          topic,
          sourceCount: data.sources.size,
          mentionCount: data.count,
          sources: Array.from(data.sources),
          examples: data.items.slice(0, 3)
        });
      }
    });

    return signals;
  }

  extractTopics(item) {
    const topics = [];
    const text = `${item.title || ''} ${item.description || ''} ${item.abstract || ''}`.toLowerCase();

    // Topics techniques
    const technicalTopics = {
      'build-tools': ['vite', 'webpack', 'rollup', 'turbo', 'build'],
      'testing': ['test', 'jest', 'vitest', 'cypress', 'playwright'],
      'performance': ['performance', 'speed', 'optimization', 'cache'],
      'devex': ['developer experience', 'dx', 'productivity', 'workflow'],
      'ai-tools': ['ai', 'machine learning', 'copilot', 'assistant'],
      'security': ['security', 'vulnerability', 'auth', 'encryption'],
      'cloud': ['cloud', 'serverless', 'edge', 'cdn'],
      'frameworks': ['react', 'vue', 'angular', 'svelte', 'next']
    };

    Object.entries(technicalTopics).forEach(([topic, keywords]) => {
      if (keywords.some(keyword => text.includes(keyword))) {
        topics.push(topic);
      }
    });

    return topics;
  }

  extractDailyInsights(scanResults) {
    const insights = [];

    if (!scanResults || !scanResults.summary) {
      return insights;
    }

    // Insight 1: Top trends du jour
    if (scanResults.summary.topTrends && scanResults.summary.topTrends.length > 0) {
      insights.push({
        type: 'daily_trends',
        title: 'Top trends identified today',
        data: scanResults.summary.topTrends,
        significance: 0.8,
        actionable: true
      });
    }

    // Insight 2: Technologies émergentes
    if (scanResults.summary.emergingTechnologies && scanResults.summary.emergingTechnologies.length > 0) {
      insights.push({
        type: 'emerging_tech',
        title: 'Emerging technologies detected',
        data: scanResults.summary.emergingTechnologies,
        significance: 0.7,
        actionable: false
      });
    }

    // Insight 3: Insights actionnables
    if (scanResults.summary.actionableInsights && scanResults.summary.actionableInsights.length > 0) {
      const highUrgencyInsights = scanResults.summary.actionableInsights.filter(
        insight => insight.urgency === 'high'
      );

      if (highUrgencyInsights.length > 0) {
        insights.push({
          type: 'actionable_insights',
          title: 'High-urgency actionable insights',
          data: highUrgencyInsights,
          significance: 0.9,
          actionable: true
        });
      }
    }

    return insights;
  }

  analyzeTrendSignals(scanResults) {
    const signals = [];

    if (!scanResults || !scanResults.trends) {
      return signals;
    }

    // Signal 1: Acceleration (trends with high mentions)
    const acceleratingTrends = scanResults.trends.filter(
      trend => trend.mentions >= 3 && trend.impact > 0.6
    );

    acceleratingTrends.forEach(trend => {
      signals.push({
        type: 'acceleration',
        trend: trend.name,
        signal: `Accelerating trend: ${trend.mentions} mentions, ${Math.round(trend.impact * 100)}% impact`,
        strength: trend.impact * (trend.mentions / 5),
        category: trend.category
      });
    });

    // Signal 2: Category convergence
    const categoryMentions = {};
    scanResults.trends.forEach(trend => {
      categoryMentions[trend.category] = (categoryMentions[trend.category] || 0) + 1;
    });

    Object.entries(categoryMentions).forEach(([category, count]) => {
      if (count >= 3) {
        signals.push({
          type: 'category_convergence',
          trend: category,
          signal: `Multiple trends in ${category} category (${count} items)`,
          strength: Math.min(count / 5, 1),
          category
        });
      }
    });

    return signals.sort((a, b) => b.strength - a.strength);
  }

  isEndOfWeek() {
    const today = new Date(this.date);
    return today.getDay() === 5; // Vendredi
  }

  async generateWeeklyAggregation() {
    const aggregation = {
      weekOf: this.date,
      totalScans: 0,
      aggregatedTrends: {},
      weeklyPatterns: [],
      recommendedFollowUps: []
    };

    try {
      // Charger les scans de la semaine
      const weeklyScans = await this.loadWeeklyScans();
      aggregation.totalScans = weeklyScans.length;

      if (weeklyScans.length > 0) {
        // Agréger les tendances
        aggregation.aggregatedTrends = this.aggregateTrends(weeklyScans);

        // Identifier patterns hebdomadaires
        aggregation.weeklyPatterns = this.identifyWeeklyPatterns(weeklyScans);

        // Recommandations pour la semaine suivante
        aggregation.recommendedFollowUps = this.generateWeeklyFollowUps(aggregation);
      }

    } catch (error) {
      console.warn(`⚠️ Weekly aggregation limited: ${error.message}`);
    }

    return aggregation;
  }

  async loadWeeklyScans() {
    const scans = [];
    const today = new Date(this.date);

    // Charger les 7 derniers jours
    for (let i = 0; i < 7; i++) {
      const scanDate = new Date(today);
      scanDate.setDate(today.getDate() - i);
      const dateStr = scanDate.toISOString().split('T')[0];

      const scanFile = `daily-scan-${dateStr}.json`;
      const filePath = path.join(this.outputDir, scanFile);

      if (fs.existsSync(filePath)) {
        try {
          const scanData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
          scans.push({ date: dateStr, data: scanData });
        } catch (error) {
          console.warn(`⚠️ Could not load ${scanFile}: ${error.message}`);
        }
      }
    }

    return scans.reverse(); // Plus ancien en premier
  }

  aggregateTrends(weeklyScans) {
    const trendCounts = {};
    const trendData = {};

    weeklyScans.forEach(scan => {
      if (scan.data.scanResults && scan.data.scanResults.trends) {
        scan.data.scanResults.trends.forEach(trend => {
          if (!trendCounts[trend.name]) {
            trendCounts[trend.name] = 0;
            trendData[trend.name] = {
              category: trend.category,
              totalImpact: 0,
              dailyMentions: []
            };
          }
          trendCounts[trend.name]++;
          trendData[trend.name].totalImpact += trend.impact || 0;
          trendData[trend.name].dailyMentions.push({
            date: scan.date,
            mentions: trend.mentions || 1
          });
        });
      }
    });

    // Créer agrégation finale
    const aggregated = {};
    Object.entries(trendCounts).forEach(([trend, count]) => {
      if (count >= 3) { // Au moins 3 jours de mention
        aggregated[trend] = {
          weeklyMentions: count,
          averageImpact: trendData[trend].totalImpact / count,
          category: trendData[trend].category,
          momentum: count / 7, // Pourcentage de jours mentionné
          dailyPattern: trendData[trend].dailyMentions
        };
      }
    });

    return aggregated;
  }

  identifyWeeklyPatterns(weeklyScans) {
    const patterns = [];

    // Pattern 1: Trends croissants
    const crescendoTrends = this.findCrescendoTrends(weeklyScans);
    patterns.push(...crescendoTrends);

    // Pattern 2: Consistency patterns
    const consistentTopics = this.findConsistentTopics(weeklyScans);
    patterns.push(...consistentTopics);

    return patterns;
  }

  findCrescendoTrends(weeklyScans) {
    // Implémentation simplifiée
    return [{
      type: 'crescendo',
      pattern: 'Developer Experience trending upward',
      confidence: 0.7
    }];
  }

  findConsistentTopics(weeklyScans) {
    return [{
      type: 'consistency',
      pattern: 'Build tools consistently mentioned',
      confidence: 0.8
    }];
  }

  generateWeeklyFollowUps(aggregation) {
    const followUps = [];

    // Follow-ups basés sur trends agrégés
    Object.entries(aggregation.aggregatedTrends).forEach(([trend, data]) => {
      if (data.momentum > 0.6 && data.averageImpact > 0.7) {
        followUps.push({
          action: `Deep dive research on ${trend}`,
          priority: 'high',
          reasoning: `High momentum (${Math.round(data.momentum * 100)}%) and impact (${Math.round(data.averageImpact * 100)}%)`,
          suggestedTimeline: 'Next week'
        });
      }
    });

    return followUps;
  }

  generateDailyRecommendations(results) {
    const recommendations = [];

    // Recommandations basées sur alertes
    results.alerts.forEach(alert => {
      if (alert.actionRequired) {
        recommendations.push({
          type: 'alert_response',
          priority: alert.severity,
          action: `Investigate ${alert.title}`,
          reasoning: alert.description,
          timeline: alert.severity === 'high' ? 'Today' : 'This week',
          effort: 'low'
        });
      }
    });

    // Recommandations basées sur insights actionnables
    const actionableInsights = results.insights.filter(i => i.actionable);
    actionableInsights.forEach(insight => {
      recommendations.push({
        type: 'insight_action',
        priority: 'medium',
        action: `Review ${insight.title}`,
        reasoning: `Daily insight with ${Math.round(insight.significance * 100)}% significance`,
        timeline: 'This week',
        effort: 'low'
      });
    });

    // Recommandations hebdomadaires (si fin de semaine)
    if (results.weeklyAggregation && results.weeklyAggregation.recommendedFollowUps) {
      recommendations.push(...results.weeklyAggregation.recommendedFollowUps.map(followUp => ({
        type: 'weekly_followup',
        priority: followUp.priority,
        action: followUp.action,
        reasoning: followUp.reasoning,
        timeline: followUp.suggestedTimeline,
        effort: 'medium'
      })));
    }

    return recommendations
      .sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      })
      .slice(0, 5); // Top 5 daily recommendations
  }

  async saveAlerts(alerts) {
    const criticalAlerts = alerts.filter(alert => alert.severity === 'high');

    if (criticalAlerts.length > 0) {
      const alertFile = path.join(this.alertsDir, `alerts-${this.date}.json`);
      const alertData = {
        date: this.date,
        timestamp: new Date().toISOString(),
        criticalAlerts,
        totalAlerts: alerts.length
      };

      fs.writeFileSync(alertFile, JSON.stringify(alertData, null, 2));
      console.log(`🚨 ${criticalAlerts.length} critical alerts saved to: ${alertFile}`);
    }
  }

  displayDailyResults(results) {
    console.log('\n' + '='.repeat(60));
    console.log(`📊 DAILY SCAN RESULTS - ${results.date}`);
    console.log('='.repeat(60));

    if (results.scanResults) {
      console.log(`\n📈 Scan Summary:`);
      console.log(`   Total Items: ${results.scanResults.summary?.totalItems || 0}`);
      console.log(`   Trends Detected: ${results.scanResults.trends?.length || 0}`);
      console.log(`   Sources Scanned: ${Object.keys(results.scanResults.sources || {}).length}`);
    }

    if (results.alerts.length > 0) {
      console.log(`\n🚨 Alerts: ${results.alerts.length}`);
      results.alerts.slice(0, 3).forEach(alert => {
        const severity = alert.severity === 'high' ? '🔴' : '🟡';
        console.log(`   ${severity} ${alert.title}`);
      });
    }

    if (results.insights.length > 0) {
      console.log(`\n💡 Daily Insights: ${results.insights.length}`);
      results.insights.forEach(insight => {
        const significance = Math.round(insight.significance * 100);
        console.log(`   • ${insight.title} (${significance}% significance)`);
      });
    }

    if (results.trendSignals.length > 0) {
      console.log(`\n📈 Trend Signals: ${results.trendSignals.length}`);
      results.trendSignals.slice(0, 3).forEach(signal => {
        const strength = Math.round(signal.strength * 100);
        console.log(`   📊 ${signal.signal} (strength: ${strength}%)`);
      });
    }

    if (results.recommendations.length > 0) {
      console.log(`\n📋 Daily Recommendations: ${results.recommendations.length}`);
      results.recommendations.slice(0, 3).forEach(rec => {
        const priority = rec.priority === 'high' ? '🔴' : '🟡';
        console.log(`   ${priority} ${rec.action} (${rec.timeline})`);
      });
    }

    if (results.weeklyAggregation && Object.keys(results.weeklyAggregation).length > 0) {
      console.log(`\n📊 Weekly Aggregation Complete:`);
      console.log(`   Total Scans This Week: ${results.weeklyAggregation.totalScans}`);
      console.log(`   Aggregated Trends: ${Object.keys(results.weeklyAggregation.aggregatedTrends || {}).length}`);
    }
  }
}

// CLI Interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const options = {
    dryRun: args.includes('--dry-run'),
    date: args.find(arg => arg.startsWith('--date='))?.split('=')[1] || undefined
  };

  const automation = new DailyScanAutomation(options);

  automation.runDailyScan()
    .then(results => {
      console.log('\n✅ Daily scan automation completed');
      if (!options.dryRun) {
        console.log(`📁 Results saved in: ${automation.outputDir}`);
      }
    })
    .catch(error => {
      console.error('❌ Daily scan automation failed:', error);
      process.exit(1);
    });
}

module.exports = DailyScanAutomation;