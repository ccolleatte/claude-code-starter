# Claude Framework Monitoring Guide

## 🎯 Overview

Comprehensive monitoring system for Claude v4.1 framework, tracking performance, quality, and anti-hallucination metrics to maintain doctoral-level standards.

## 📊 Key Performance Indicators (KPIs)

### 🚨 Critical Metrics (P0)

| Metric | Target | Alert Threshold | Impact |
|--------|--------|-----------------|---------|
| **Daily Hallucinations** | 0 | ≥ 3 | Framework reliability |
| **Config Errors** | 0 | ≥ 1 | System stability |
| **Security Violations** | 0 | ≥ 1 | Data protection |
| **Test Failures** | 0% | ≥ 5% | Code quality |

### ⚡ Performance Metrics (P1)

| Metric | Target | Alert Threshold | Impact |
|--------|--------|-----------------|---------|
| **Response Time** | < 2s | ≥ 5s | User experience |
| **Config Load Time** | < ${CONFIG_LOAD_THRESHOLD:-500ms} | ≥ ${CONFIG_ALERT_THRESHOLD:-1000ms} | Startup performance |
| **Memory Usage** | < 50MB | ≥ 100MB | Resource efficiency |
| **Template Cache Hit** | > ${CACHE_HIT_TARGET:-80%} | < ${CACHE_HIT_ALERT:-70%} | Response speed |

### 📈 Quality Metrics (P2)

| Metric | Target | Alert Threshold | Impact |
|--------|--------|-----------------|---------|
| **Test Coverage** | > ${TEST_COVERAGE_TARGET:-80%} | < ${TEST_COVERAGE_ALERT:-70%} | Code reliability |
| **Documentation Coverage** | > ${DOC_COVERAGE_TARGET:-85%} | < ${DOC_COVERAGE_ALERT:-75%} | Maintainability |
| **Template Usage Rate** | > 80% | < 60% | Framework adoption |
| **Error Recovery Rate** | > ${ERROR_RECOVERY_TARGET:-85%} | < ${ERROR_RECOVERY_ALERT:-75%} | Resilience |

## 🔔 Alerting Rules

### Severity Levels

#### 🔴 CRITICAL (P0) - Immediate Response Required
```bash
# Triggers
- Hallucinations >= 3/day
- Security violations detected
- Config errors preventing startup
- Test suite failure rate >= 10%

# Actions
- Instant notification (SMS/Slack)
- Auto-rollback if possible
- Incident report creation
- Lead developer notification
```

#### 🟡 WARNING (P1) - Response Within 2 Hours
```bash
# Triggers  
- Response time >= 5s sustained
- Memory usage >= 100MB
- Template errors >= 5/hour
- Coverage drop >= 5%

# Actions
- Email notification
- Performance analysis
- Resource monitoring
- Optimization planning
```

#### 🔵 INFO (P2) - Daily Review
```bash
# Triggers
- Usage patterns anomalies
- Performance degradation < 20%
- Documentation gaps
- Minor configuration warnings

# Actions
- Daily report inclusion
- Trend analysis
- Optimization suggestions
- Documentation updates
```

### Alert Configuration

#### Hallucination Detection
```bash
# Types tracked
- Function invention
- File creation without analysis
- Import assumptions
- Test false positives
- Configuration hallucinations

# Automatic triggers
scripts/claude-metrics.sh hallucination function_invention high "invented calculateScore()"
```

#### Performance Monitoring
```bash
# Response time tracking
start_time=$(date +%s.%3N)
# ... operation ...
scripts/claude-metrics.sh response-time "file_search" "$start_time"

# Memory monitoring
memory_usage=$(ps -o pid,vsz,rss,comm -p $$ | awk 'NR==2{print $2}')
if [ "$memory_usage" -gt 100000 ]; then
    scripts/claude-metrics.sh config-error memory system "Usage: ${memory_usage}KB"
fi
```

## 📊 Dashboard Setup

### Real-time Monitoring
```bash
# Live dashboard (updates every 30s)
watch -n 30 'scripts/claude-metrics.sh dashboard 1'

# Hourly trends
scripts/claude-metrics.sh dashboard 24

# Weekly summary
for day in {0..6}; do
    date_str=$(date -d "$day days ago" +%Y-%m-%d)
    scripts/claude-metrics.sh report "$date_str"
done
```

### Grafana Integration (Optional)
```yaml
# grafana-config.yml
datasources:
  - name: claude-metrics
    type: json
    url: file://.claude/metrics/daily-$(date +%Y%m%d).json

dashboards:
  claude-framework:
    panels:
      - title: "Hallucinations/Day"
        type: stat
        targets: ["metrics.hallucinations.count"]
      - title: "Response Time Trend"
        type: graph
        targets: ["metrics.response_time.average"]
      - title: "Template Usage"
        type: pie
        targets: ["metrics.template_usage.total"]
```

### Custom Dashboard HTML
```html
<!-- .claude/metrics/dashboard.html -->
<!DOCTYPE html>
<html>
<head>
    <title>Claude Framework Dashboard</title>
    <meta http-equiv="refresh" content="30">
</head>
<body>
    <h1>Claude v4.1 Monitoring</h1>
    <div id="metrics">
        <!-- Auto-populated by scripts/claude-dashboard.js -->
    </div>
    <script src="claude-dashboard.js"></script>
</body>
</html>
```

## 📈 Trend Analysis

### Daily Patterns
```bash
# Identify peak usage hours
awk -F'|' '{
    hour=substr($1,12,2); 
    count[hour]++
} END {
    for(h in count) print h ":00 - " count[h] " operations"
}' .claude/metrics/claude-metrics.log

# Hallucination patterns by time
grep "hallucination" .claude/metrics/claude-metrics.log | \
awk -F'|' '{hour=substr($1,12,2); print hour}' | \
sort | uniq -c | sort -nr
```

### Weekly/Monthly Reports
```bash
# Weekly aggregation
for week in {0..3}; do
    start_date=$(date -d "$((week*7)) days ago" +%Y-%m-%d)
    end_date=$(date -d "$(((week*7)-6)) days ago" +%Y-%m-%d)
    echo "Week $week ($start_date to $end_date):"
    awk -F'|' -v start="$start_date" -v end="$end_date" \
        '$1 >= start && $1 <= end' .claude/metrics/claude-metrics.log | \
        wc -l
done
```

## 🛠️ Troubleshooting Runbooks

### High Hallucination Rate
```bash
# Investigation steps
1. Check recent changes: git log --oneline -10
2. Analyze patterns: grep "hallucination" .claude/metrics/claude-metrics.log | tail -10
3. Review context: Check specific files/operations with issues
4. Rollback if needed: git reset --hard HEAD~1
5. Update validation rules

# Prevention
- Increase validation strictness
- Add pre-commit hooks
- Review training examples
```

### Performance Degradation
```bash
# Diagnosis
1. Check memory usage: scripts/claude-metrics.sh dashboard 1
2. Profile operations: time operations individually
3. Analyze logs: grep "response_time" .claude/metrics/claude-metrics.log | tail -20
4. Check system resources: top, iostat

# Optimization
- Cache frequently used configs
- Optimize template loading
- Reduce file I/O operations
- Update hardware if needed
```

### Configuration Errors
```bash
# Recovery process
1. Validate syntax: python -m pytest tests/claude/test_templates_syntax.py
2. Check environment: npm run check:env
3. Verify structure: npm run validate:structure
4. Reset to known good: git checkout HEAD -- .claude/
5. Reapply changes carefully

# Prevention
- Use validation scripts before commits
- Implement schema validation
- Regular backup of working configs
```

## 📋 Maintenance Schedule

### Daily (Automated)
- [ ] Generate daily metrics report
- [ ] Check alert thresholds
- [ ] Validate configuration integrity
- [ ] Update performance baselines

### Weekly (Manual Review)
- [ ] Analyze trend patterns
- [ ] Review alert accuracy
- [ ] Update thresholds if needed
- [ ] Performance optimization review

### Monthly (Strategic)
- [ ] Framework health assessment
- [ ] KPI target adjustment
- [ ] Monitoring tool updates
- [ ] Training data refinement

## 🔧 Tool Integration

### CI/CD Integration
```yaml
# Add to .github/workflows/claude-validation.yml
- name: Collect metrics
  run: |
    scripts/claude-metrics.sh response-time "ci_pipeline" "$START_TIME"
    scripts/claude-metrics.sh template "CLAUDE.md" "validation" "true"
```

### IDE Integration
```bash
# VS Code task.json
{
    "label": "Claude Metrics Dashboard",
    "type": "shell",
    "command": "scripts/claude-metrics.sh dashboard 24"
}
```

### Slack/Discord Webhooks
```bash
# .claude/hooks/alert.sh
#!/bin/bash
WEBHOOK_URL="${SLACK_WEBHOOK_URL}"
curl -X POST -H 'Content-type: application/json' \
  --data "{\"text\":\"🚨 Claude Alert: $1 - $2\"}" \
  "$WEBHOOK_URL"
```

## 📊 Sample Queries

### Top Hallucination Types
```bash
grep "hallucination" .claude/metrics/claude-metrics.log | \
cut -d'|' -f4 | cut -d':' -f1 | sort | uniq -c | sort -nr
```

### Performance by Operation
```bash
grep "response_time" .claude/metrics/claude-metrics.log | \
awk -F'|' '{print $4, $3}' | sort | \
awk '{op=$1; time=$2; count[op]++; sum[op]+=time} END {
    for(o in count) printf "%-20s %6.3fs (%d ops)\n", o, sum[o]/count[o], count[o]
}'
```

### Template Success Rate
```bash
grep "template_usage" .claude/metrics/claude-metrics.log | \
awk -F'|' '{
    template=split($4,parts,":")[1]; 
    success=$3; 
    total[template]++; 
    if(success=="true") ok[template]++
} END {
    for(t in total) printf "%-30s %6.1f%% (%d/%d)\n", 
                           t, (ok[t]/total[t])*100, ok[t], total[t]
}'
```

---
**Version**: 1.0.0  
**Update Frequency**: Real-time monitoring, daily reports  
**Retention**: 30 days detailed, 1 year aggregated  
**Contact**: Framework team for threshold adjustments