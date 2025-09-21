# 🐛 Debug Mode Activation & Troubleshooting Guide

**Purpose**: Complete guide for activating debug mode and troubleshooting Claude Code project issues
**Version**: 1.0
**Last Updated**: September 19, 2025

---

## 🎯 **Quick Debug Activation**

### **Immediate Debug Mode**
```bash
# Enable debug for current session
export DEBUG_MODE=true

# Run any script with debug
DEBUG_MODE=true bash scripts/claude-metrics.sh dashboard
DEBUG_MODE=true bash scripts/security-monitor.sh scan
DEBUG_MODE=true bash scripts/retry-logic.sh examples
```

### **Persistent Debug Mode**
```bash
# Add to .env file (create if missing)
echo "DEBUG_MODE=true" >> .env

# Or set in shell profile
echo 'export DEBUG_MODE=true' >> ~/.bashrc  # Linux/macOS
echo 'export DEBUG_MODE=true' >> ~/.zshrc   # macOS with zsh
```

### **VS Code Debug Tasks**
Use predefined debug tasks in VS Code:
- **Ctrl+Shift+P** → "Tasks: Run Task"
- Select: "🐛 Debug: Security Monitor" or "🐛 Debug: Metrics Collection"

---

## 🔧 **Debug Mode Features by Script**

### **1. Claude Metrics (`claude-metrics.sh`)**

**Debug Output Includes:**
- Metric logging details (type, value, context)
- Hallucination processing steps
- Response time calculations
- Daily report generation progress
- Alert sending details
- Cleanup operations

**Example Debug Output:**
```bash
DEBUG_MODE=true bash scripts/claude-metrics.sh dashboard

# Expected output:
# DEBUG: Starting daily report generation for 2025-09-19
# DEBUG: Metrics file: .claude/metrics/claude-metrics.log
# DEBUG: Found 15 metrics for 2025-09-19
# ℹ️ Last 24 hours dashboard data:
# Hallucinations: 0
# Config Errors: 0
```

### **2. Security Monitor (`security-monitor.sh`)**

**Debug Output Includes:**
- Secret pattern matching details
- File scanning progress
- Vulnerability assessment steps
- Scoring calculations
- Alert generation process

**Example Debug Output:**
```bash
DEBUG_MODE=true bash scripts/security-monitor.sh scan

# Expected output:
# DEBUG: Starting security scan...
# DEBUG: Checking secrets in repository...
# DEBUG: Scanning 45 files for secret patterns
# DEBUG: No secrets found in scan
# DEBUG: Calculating security score: 100/100
```

### **3. Retry Logic (`retry-logic.sh`)**

**Debug Output Includes:**
- Retry attempt details
- Backoff delay calculations
- Error classification (retryable/non-retryable)
- Command execution traces
- Fallback activation

**Example Debug Output:**
```bash
source scripts/retry-logic.sh
DEBUG_MODE=true retry_with_backoff "curl -f https://httpstat.us/500" "test_operation"

# Expected output:
# DEBUG: Starting retry operation: test_operation
# DEBUG: Command: curl -f https://httpstat.us/500
# DEBUG: Max retries: 3
# DEBUG: Attempt 1/3 for test_operation
# DEBUG: Attempt 1 failed with exit code 22
# DEBUG: Waiting 1s before retry
```

---

## 🚨 **Common Issues & Solutions**

### **Issue: Scripts Exit with Code 2**
**Symptoms:**
- All bash scripts fail immediately
- Exit code 2 consistently
- No meaningful error output

**Possible Causes & Solutions:**

#### **1. Line Ending Issues (Windows)**
```bash
# Check for Windows line endings
file scripts/claude-metrics.sh
# Should show: "ASCII text" not "ASCII text, with CRLF line terminators"

# Fix line endings
dos2unix scripts/*.sh
# Or in Git Bash:
sed -i 's/\r$//' scripts/*.sh
```

#### **2. Missing Dependencies**
```bash
# Check required commands
which bash bc jq curl
# Install missing tools:
# Windows: choco install jq
# macOS: brew install jq bc
# Linux: apt-get install jq bc
```

#### **3. Script Permissions**
```bash
# On Unix systems, make scripts executable
chmod +x scripts/*.sh

# Windows: Ensure running in Git Bash or WSL
```

### **Issue: "Command Not Found" Errors**
**Symptoms:**
- `bc: command not found`
- `jq: command not found`
- Path-related failures

**Solutions:**
```bash
# Install missing dependencies
# Windows (Chocolatey):
choco install jq
choco install gnuwin32-coreutils

# Windows (Scoop):
scoop install jq
scoop install bc

# macOS:
brew install jq bc

# Linux:
sudo apt-get install jq bc
# or
sudo yum install jq bc
```

### **Issue: Debug Output Not Showing**
**Symptoms:**
- DEBUG_MODE=true set but no debug output
- Scripts run but without verbose information

**Troubleshooting Steps:**
```bash
# 1. Verify environment variable is set
echo $DEBUG_MODE
# Should output: true

# 2. Test with explicit setting
DEBUG_MODE=true bash -x scripts/claude-metrics.sh dashboard

# 3. Check script sources safe-output.sh correctly
ls -la scripts/safe-output.sh

# 4. Test safe_echo function directly
source scripts/safe-output.sh
safe_echo "Test debug message" "info"
```

### **Issue: File Access Permissions**
**Symptoms:**
- "Permission denied" errors
- Cannot create metrics directories
- Log file write failures

**Solutions:**
```bash
# Check current permissions
ls -la .claude/
ls -la scripts/

# Fix directory permissions
chmod 755 .claude/
chmod 755 .claude/metrics/
chmod 644 .claude/metrics/*.log

# Ensure script permissions
chmod +x scripts/*.sh
```

---

## 🔍 **Advanced Debugging Techniques**

### **1. Bash Debug Mode**
```bash
# Run with bash debugging
bash -x scripts/claude-metrics.sh dashboard

# Show execution trace
set -x
bash scripts/security-monitor.sh scan
set +x
```

### **2. Environment Inspection**
```bash
# Check all relevant environment variables
env | grep -E "(DEBUG|CLAUDE|METRICS|API)"

# Verify script variables
DEBUG_MODE=true bash -c 'source scripts/claude-metrics.sh; echo "DEBUG_MODE: $DEBUG_MODE"'
```

### **3. Step-by-Step Testing**
```bash
# Test individual components
source scripts/retry-logic.sh
source scripts/safe-output.sh

# Test functions individually
safe_echo "Test message" "info"
retry_with_backoff "echo 'test'" "test_operation"
```

### **4. Log File Analysis**
```bash
# Check recent log entries
tail -20 .claude/metrics/claude-metrics.log

# Watch logs in real-time
tail -f .claude/metrics/claude-metrics.log

# Search for specific patterns
grep "ERROR\|WARN" .claude/metrics/claude-metrics.log

# Check alert logs
cat .claude/metrics/alerts.log
```

---

## 📊 **Troubleshooting Checklist**

### **Basic Environment Check**
- [ ] `DEBUG_MODE=true` is set
- [ ] All required tools installed (`bash`, `bc`, `jq`, `curl`)
- [ ] Scripts have proper permissions (`chmod +x`)
- [ ] `.claude/metrics/` directory exists and is writable
- [ ] No conflicting environment variables

### **Script-Specific Checks**

#### **Claude Metrics**
- [ ] `.claude/metrics/claude-metrics.log` exists
- [ ] Safe output functions work (`source scripts/safe-output.sh`)
- [ ] Date commands work (`date -Iseconds`)
- [ ] Math operations work (`echo "1 + 1" | bc`)

#### **Security Monitor**
- [ ] Git repository is initialized
- [ ] `.gitignore` file exists
- [ ] Security patterns file readable
- [ ] JSON processing works (`echo '{}' | jq .`)

#### **Retry Logic**
- [ ] Network connectivity available
- [ ] Curl/wget available for testing
- [ ] Temporary file creation works
- [ ] Sleep command available

### **Windows-Specific Checks**
- [ ] Using Git Bash or WSL (not Command Prompt)
- [ ] Line endings are Unix-style (`\n` not `\r\n`)
- [ ] No space characters in paths
- [ ] Windows Defender not blocking script execution

---

## 🛠️ **Debug Mode Configuration**

### **Global Debug Settings**
```bash
# In .env file
DEBUG_MODE=true
VERBOSE_LOGGING=true
LOG_LEVEL=debug

# Additional debug options
TRACE_EXECUTION=true
SAVE_DEBUG_LOGS=true
DEBUG_OUTPUT_FILE=.claude/debug.log
```

### **Per-Script Debug Options**
```bash
# Security Monitor specific
SECURITY_DEBUG=true
SCAN_VERBOSE=true

# Metrics specific
METRICS_DEBUG=true
DASHBOARD_VERBOSE=true

# Retry Logic specific
RETRY_DEBUG=true
SHOW_RETRY_ATTEMPTS=true
```

### **VS Code Debug Configuration**
Add to `.vscode/settings.json`:
```json
{
  "terminal.integrated.env.windows": {
    "DEBUG_MODE": "true",
    "VERBOSE_LOGGING": "true"
  },
  "terminal.integrated.env.linux": {
    "DEBUG_MODE": "true",
    "VERBOSE_LOGGING": "true"
  },
  "terminal.integrated.env.osx": {
    "DEBUG_MODE": "true",
    "VERBOSE_LOGGING": "true"
  }
}
```

---

## 🚀 **Quick Recovery Commands**

### **Reset Everything**
```bash
# Reset debug environment
unset DEBUG_MODE VERBOSE_LOGGING TRACE_EXECUTION

# Clear debug logs
rm -f .claude/debug.log .claude/metrics/debug-*.log

# Restart with clean state
DEBUG_MODE=true bash scripts/claude-metrics.sh dashboard
```

### **Emergency Debug**
```bash
# Maximum verbosity for troubleshooting
DEBUG_MODE=true VERBOSE_LOGGING=true TRACE_EXECUTION=true \
bash -x scripts/security-monitor.sh scan 2>&1 | tee debug-output.log
```

### **Test All Systems**
```bash
# Run comprehensive debug test
DEBUG_MODE=true python tests/test_api_recovery_simple.py

# Test individual components
DEBUG_MODE=true bash scripts/retry-logic.sh examples
DEBUG_MODE=true bash scripts/claude-metrics.sh dashboard
DEBUG_MODE=true bash scripts/security-monitor.sh scan
```

---

## 📞 **Getting Help**

### **Documentation References**
- **Main Project Guide**: `CLAUDE.md`
- **Security Setup**: `SECURITY-SETUP.md`
- **Architecture Details**: `docs/security/ARCHITECTURE-DEFENSIVE.md`

### **Log Collection for Support**
```bash
# Collect all relevant logs
mkdir -p debug-collection
cp .claude/metrics/*.log debug-collection/
cp .claude/debug.log debug-collection/ 2>/dev/null || true
cp .env.example debug-collection/
echo "$DEBUG_MODE" > debug-collection/debug-mode-status.txt

# Create debug report
DEBUG_MODE=true bash scripts/claude-metrics.sh dashboard > debug-collection/dashboard-output.txt 2>&1

# Compress for sharing
tar -czf debug-collection-$(date +%Y%m%d-%H%M).tar.gz debug-collection/
```

### **Safe Information to Share**
- ✅ Script output with DEBUG_MODE=true
- ✅ Error messages and exit codes
- ✅ Environment variable names (not values)
- ✅ File permissions and directory structure
- ❌ API keys or sensitive configuration
- ❌ Actual log contents that might contain secrets

---

**Remember**: Always test debug mode in a safe environment first, and never commit debug logs or sensitive information to version control.