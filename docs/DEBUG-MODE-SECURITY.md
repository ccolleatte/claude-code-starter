# 🐛 Debug Mode Security Guide

## ⚠️ Security Warning

**DEBUG_MODE should NEVER be enabled in production environments.**

When debug mode is active, sensitive information may be logged including:
- Internal system paths
- Detailed error messages
- Performance metrics
- Alert details
- Command execution traces

## 🔐 Safe Activation

### Development Environment Only

```bash
# ✅ Safe: Local development
DEBUG_MODE=true ./scripts/claude-metrics.sh report

# ✅ Safe: Temporary debugging session
DEBUG_MODE=true npm run metrics:dashboard
```

### Environment Detection

The script automatically detects and warns about unsafe environments:

- **CI/CD Pipelines** (GitHub Actions, GitLab CI, etc.)
- **Production Servers** 
- **Shared Development Systems**

### Security Controls

1. **Automatic Warnings**: Debug mode displays security warnings on activation
2. **Environment Detection**: Warns if activated in CI/CD environments
3. **Data Sanitization**: Production mode sanitizes sensitive data automatically
4. **Cleanup Protection**: Debug mode prevents destructive operations

## 🛡️ Production Safety

### Data Sanitization

When NOT in debug mode, the script automatically:

```bash
# Context sanitization
context=$(echo "$context" | sed 's/[^a-zA-Z0-9 ._-]//g' | cut -c1-100)

# Operation name sanitization  
operation=$(echo "$operation" | sed 's/[^a-zA-Z0-9_-]//g' | cut -c1-50)

# Alert details sanitization
details=$(echo "$details" | sed 's/[^a-zA-Z0-9 ._:-]//g' | cut -c1-200)
```

### Input Validation

Production mode enforces strict validation:

- **Date formats**: Must match `YYYY-MM-DD` pattern
- **Numeric inputs**: Must be valid integers within safe ranges
- **File operations**: Restricted to metrics directory only

## 🔧 Debug Features

### Enhanced Logging

```bash
DEBUG_MODE=true ./scripts/claude-metrics.sh hallucination test medium "debug session"
```

Output includes:
- 🐛 Debug prefixes for all debug messages
- Detailed operation traces
- File path information
- Sanitization notifications
- Environment validation results

### Safe Cleanup Mode

In debug mode, cleanup operations are logged but NOT executed:

```bash
DEBUG_MODE=true ./scripts/claude-metrics.sh cleanup 30
# Output: "DEBUG MODE: Cleanup operations logged but not executed"
```

### Alert Testing

Debug mode allows safe alert testing without triggering external hooks:

```bash
DEBUG_MODE=true ./scripts/claude-metrics.sh hallucination test high "alert test"
```

## 📋 Debug Checklist

Before enabling debug mode:

- [ ] ✅ Working in local development environment
- [ ] ✅ No sensitive production data present
- [ ] ✅ Not in CI/CD pipeline
- [ ] ✅ Not on shared/production server
- [ ] ✅ Understanding that detailed logs will be generated
- [ ] ✅ Will disable debug mode after debugging session

## 🚨 Emergency Procedures

### If Debug Mode Enabled in Production

1. **Immediate Action**:
   ```bash
   unset DEBUG_MODE
   # or
   export DEBUG_MODE=false
   ```

2. **Log Review**:
   - Check `.claude/metrics/` for sensitive data in logs
   - Review daily reports for exposed information
   - Check `alerts.log` for detailed alert information

3. **Cleanup**:
   ```bash
   # Rotate logs immediately
   ./scripts/claude-metrics.sh cleanup 1
   
   # Archive sensitive logs
   mv .claude/metrics/claude-metrics.log .claude/metrics/archive/incident-$(date +%Y%m%d).log
   ```

### If Sensitive Data Logged

1. **Identify Exposure**:
   ```bash
   grep -i "DEBUG:" .claude/metrics/claude-metrics.log
   grep -i "SENSITIVE:" .claude/metrics/claude-metrics.log
   ```

2. **Secure Removal**:
   ```bash
   # Remove sensitive entries
   sed -i '/DEBUG:/d' .claude/metrics/claude-metrics.log
   sed -i '/SENSITIVE:/d' .claude/metrics/claude-metrics.log
   ```

3. **Report Incident** if required by security policy

## 🔍 Debugging Workflows

### Common Debug Sessions

```bash
# 1. Testing hallucination tracking
DEBUG_MODE=true ./scripts/claude-metrics.sh hallucination function_test low "testing system"

# 2. Analyzing response times
DEBUG_MODE=true ./scripts/claude-metrics.sh response-time test_operation 1234567890.123

# 3. Validating report generation
DEBUG_MODE=true ./scripts/claude-metrics.sh report 2024-01-15

# 4. Dashboard data verification
DEBUG_MODE=true ./scripts/claude-metrics.sh dashboard 12
```

### Log Analysis

Debug logs provide structured information:

```
🐛 DEBUG: Logging metric - Type: hallucination, Value: low, Context: function_test:testing system
🐛 DEBUG: Processing hallucination - Type: function_test, Severity: low
🐛 DEBUG: Sanitized context for production: testing system
```

## 📖 Best Practices

### Do ✅

- Use debug mode only in isolated development environments
- Enable for specific debugging sessions, then disable
- Review debug output for sensitive information before sharing
- Use debug mode to validate security controls are working
- Test data sanitization by comparing debug vs production output

### Don't ❌

- Enable debug mode in production
- Commit files with DEBUG_MODE=true hardcoded
- Share debug logs containing sensitive information
- Leave debug mode enabled permanently
- Use debug mode in CI/CD pipelines
- Enable debug mode on shared development servers

## 🔗 Related Security Documents

- [CLAUDE-SETTINGS.md](../.claude/CLAUDE-SETTINGS.md) - Permission configurations
- [CLAUDE-ERRORS.md](../.claude/CLAUDE-ERRORS.md) - Error handling patterns
- [CLAUDE.md](../.claude/CLAUDE.md) - Security rules and guidelines

---

**Security Level**: CRITICAL  
**Review Frequency**: Before each production deployment  
**Owner**: Security Team  
**Last Updated**: $(date +%Y-%m-%d)