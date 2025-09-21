# 📊 Security Monitoring Guide - Claude Code Projects

**Purpose**: Continuous security monitoring and alerting for Claude Code projects
**Version**: 1.0
**Last Updated**: September 19, 2025

---

## 🎯 **Overview**

The security monitoring system provides automated detection and alerting for:
- **Secret exposure** in code repositories
- **Dependency vulnerabilities** (Python/Node.js)
- **File integrity issues** (missing or misconfigured security files)
- **Process anomalies** (suspicious running processes)

## 🚀 **Quick Start**

### **One-Time Security Scan**
```bash
# Run immediate security assessment
bash scripts/security-monitor.sh scan

# With debug output
DEBUG_MODE=true bash scripts/security-monitor.sh scan
```

### **Continuous Monitoring**
```bash
# Monitor every 5 minutes (default)
bash scripts/security-monitor.sh monitor

# Monitor every 10 minutes
bash scripts/security-monitor.sh monitor 600

# Background monitoring
nohup bash scripts/security-monitor.sh monitor 300 &
```

### **Check Current Status**
```bash
# View latest security metrics
bash scripts/security-monitor.sh status

# View detailed metrics file
cat .claude/metrics/security-$(date +%Y%m%d).json | jq .
```

---

## 📊 **Monitoring Components**

### **1. Secret Detection**
**What it checks:**
- API key patterns in git repository (sk-ant-*, sk-*, AWS keys)
- `.env` files tracked by git
- Password/secret patterns in code
- File permissions on sensitive files

**Patterns monitored:**
```regex
sk-ant-api03-[A-Za-z0-9_-]{95}    # Anthropic API keys
sk-[A-Za-z0-9_-]{48,}              # OpenAI API keys
AKIAI[0-9A-Z]{16}                  # AWS access keys
password\s*=\s*["'][^"']+["']      # Hardcoded passwords
secret\s*=\s*["'][^"']+["']        # Hardcoded secrets
```

**Alert levels:**
- 🚨 **CRITICAL**: Real secrets found in repository
- ⚠️ **WARNING**: Suspicious file permissions
- ℹ️ **INFO**: No secrets detected

### **2. Dependency Vulnerabilities**
**What it checks:**
- Python packages via `pip-audit` (if available)
- Node.js packages via `npm audit`
- Vulnerability severity levels
- Outdated packages with known CVEs

**Thresholds:**
- **HIGH/CRITICAL**: Immediate alerts
- **MODERATE**: Warning alerts
- **LOW**: Info logging only

### **3. File Integrity**
**What it checks:**
- Critical security files exist (`.gitignore`, `.env.example`, `SECURITY-SETUP.md`)
- `.gitignore` contains security patterns
- Recent modifications to sensitive files
- Proper file permissions

**Critical files monitored:**
```bash
.gitignore          # Must exist and contain .env pattern
.env.example        # Template for environment setup
SECURITY-SETUP.md   # Security documentation
```

### **4. Process Security**
**What it checks:**
- Suspicious processes (netcat, nmap, wireshark)
- High CPU usage (potential crypto mining)
- Unauthorized network tools
- Process anomalies

---

## 🔔 **Alerting System**

### **Alert Levels**

| Level | Trigger | Action Required |
|-------|---------|--------------——|
| 🚨 **CRITICAL** | Secrets exposed, Score < 50 | Immediate action |
| ⚠️ **WARNING** | Vulnerabilities, Score < 70 | Review within 24h |
| ℹ️ **INFO** | Normal operations | No action needed |

### **Scoring System**

**Base Score**: 100 points

**Deductions:**
- **Exposed secrets**: -30 points each
- **Vulnerabilities**: -5 points each
- **Integrity issues**: -10 points each
- **Process issues**: -20 points each

**Score interpretation:**
- **90-100**: Excellent security posture
- **70-89**: Good security (minor issues)
- **50-69**: Moderate security (review needed)
- **0-49**: Poor security (critical action required)

### **Metrics Output**

```json
{
    "timestamp": "2025-09-19T15:30:00Z",
    "scan_duration_ms": 2500,
    "security_score": 85,
    "findings": {
        "secrets_exposed": 0,
        "vulnerabilities": 3,
        "integrity_issues": 1,
        "process_issues": 0
    },
    "thresholds": {
        "alert_threshold": 3,
        "score_warning": 70,
        "score_critical": 50
    },
    "recommendations": [
        "High priority: Update vulnerable dependencies",
        "Medium priority: Fix file integrity issues"
    ]
}
```

---

## 🔧 **Configuration**

### **Environment Variables**

```bash
# Enable debug mode for detailed output
export DEBUG_MODE=true

# Set alert threshold (number of issues before critical alert)
export ALERT_THRESHOLD=5

# Custom log location
export LOG_FILE="/custom/path/security.log"
```

### **Customizing Scans**

**Add custom secret patterns** (edit `scripts/security-monitor.sh`):
```bash
secret_patterns+=(
    "password123"                    # Custom password pattern
    "mycompany-[A-Z0-9]{16}"        # Company-specific tokens
)
```

**Modify thresholds**:
```bash
# In security-monitor.sh
ALERT_THRESHOLD=5               # Increase tolerance
SCORE_WARNING=60               # Lower warning threshold
SCORE_CRITICAL=30              # Lower critical threshold
```

### **Integration with CI/CD**

**GitHub Actions** (`.github/workflows/security.yml`):
```yaml
name: Security Monitoring
on:
  push:
    branches: [main]
  schedule:
    - cron: '0 */6 * * *'  # Every 6 hours

jobs:
  security-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run Security Scan
        run: bash scripts/security-monitor.sh scan
```

**Local Git Hooks** (`.git/hooks/pre-commit`):
```bash
#!/bin/bash
# Run security scan before each commit
bash scripts/security-monitor.sh scan
```

---

## 📈 **Monitoring Dashboard**

### **Daily Security Report**
```bash
# Generate daily report
date_today=$(date +%Y%m%d)
echo "📊 Security Report - $(date)"
echo "================================"

if [[ -f ".claude/metrics/security-${date_today}.json" ]]; then
    jq -r '
        "Security Score: \(.security_score)/100",
        "Scan Duration: \(.scan_duration_ms)ms",
        "Issues Found:",
        "  - Secrets: \(.findings.secrets_exposed)",
        "  - Vulnerabilities: \(.findings.vulnerabilities)",
        "  - Integrity: \(.findings.integrity_issues)",
        "  - Processes: \(.findings.process_issues)"
    ' ".claude/metrics/security-${date_today}.json"
else
    echo "No security scan performed today"
fi
```

### **Weekly Trend Analysis**
```bash
# Analyze security trends over last 7 days
for i in {0..6}; do
    date_check=$(date -d "-$i days" +%Y%m%d 2>/dev/null || date -v-${i}d +%Y%m%d)
    if [[ -f ".claude/metrics/security-${date_check}.json" ]]; then
        score=$(jq -r '.security_score' ".claude/metrics/security-${date_check}.json")
        echo "$(date -d "-$i days" +%Y-%m-%d): $score/100"
    fi
done
```

---

## 🚨 **Incident Response**

### **Secret Exposure Response**
```bash
# 1. Immediate containment
git rm .env                          # Remove if committed
git commit -m "Remove exposed secrets"

# 2. Key rotation
# - Revoke exposed keys on service provider
# - Generate new keys
# - Update .env with new keys

# 3. History cleanup (if needed)
git filter-branch --force --index-filter \
  'git rm --cached --ignore-unmatch .env' \
  --prune-empty --tag-name-filter cat -- --all
```

### **Vulnerability Response**
```bash
# Python vulnerabilities
pip-audit --fix              # Auto-fix if possible
pip install --upgrade package-name

# Node.js vulnerabilities
npm audit fix                # Auto-fix
npm update package-name      # Manual update
```

### **Integrity Issues Response**
```bash
# Restore missing security files
cp templates/security/gitignore.template .gitignore
cp templates/security/env.template .env.example

# Fix file permissions
chmod 600 .env               # If .env exists
chmod 644 .env.example       # Template file
```

---

## 📚 **Best Practices**

### **Monitoring Schedule**
- **Development**: Every 30 minutes during active work
- **Staging**: Every 5 minutes
- **Production**: Every 1 minute with alerting
- **CI/CD**: On every commit and daily scheduled

### **Alert Fatigue Prevention**
- Set appropriate thresholds for your environment
- Use progressive alerting (INFO → WARNING → CRITICAL)
- Implement alert suppression for known false positives
- Regular maintenance of monitoring rules

### **Performance Optimization**
```bash
# Reduce scan frequency for large repositories
bash scripts/security-monitor.sh monitor 1800  # 30 minutes

# Skip expensive checks in development
export SKIP_PROCESS_CHECK=true
export SKIP_DEPENDENCY_CHECK=true
```

### **Team Integration**
- Share security metrics dashboard with team
- Include security score in daily standups
- Set team goals for security score improvement
- Create security champions rotation

---

## 🔗 **Integration Examples**

### **Slack Notifications**
```bash
# Add to security-monitor.sh alert function
if [[ "$severity" == "CRITICAL" ]]; then
    curl -X POST -H 'Content-type: application/json' \
         --data "{\"text\":\"🚨 Security Alert: $message\"}" \
         "$SLACK_WEBHOOK_URL"
fi
```

### **Email Alerts**
```bash
# Simple email alert
echo "Security Alert: $message" | mail -s "Claude Code Security" admin@company.com
```

### **Custom Metrics Export**
```bash
# Export to monitoring system
curl -X POST "$MONITORING_ENDPOINT" \
     -H "Content-Type: application/json" \
     -d "@$METRICS_FILE"
```

---

**Next Steps**: See `ARCHITECTURE-DEFENSIVE.md` for deeper security architecture guidance.