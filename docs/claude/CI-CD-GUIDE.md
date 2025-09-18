# CI/CD Guide - Claude Configuration Framework

## 🎯 Pipeline Overview

The Claude validation pipeline implements automated quality gates for the v4.1 framework, ensuring doctoral-level standards are maintained across all commits and pull requests.

## 🔄 Workflow Triggers

```yaml
on:
  push:
    branches: [ main, develop, feature/*, fix/* ]
  pull_request:
    branches: [ main, develop ]
```

**Rationale**: Validates all code paths while allowing feature branch development without blocking main.

## 🧪 Validation Jobs

### 1. Template Syntax Validation
**Purpose**: Ensures all CLAUDE*.md files maintain proper syntax and size constraints

**Key Checks**:
- Markdown syntax validation using BeautifulSoup
- CLAUDE.md < 150 lines (critical rules only)
- Other templates < 500 lines (detailed content)
- YAML frontmatter validation

**Failure Conditions**:
- Invalid markdown syntax
- File size exceeds limits
- Missing required sections

### 2. MCP Scripts Functionality
**Purpose**: Validates Model Context Protocol scripts are executable and syntactically correct

**Key Checks**:
- Script permissions (755)
- Bash syntax validation (`bash -n`)
- Environment variable handling
- Error handling patterns

**Failure Conditions**:
- Scripts not executable
- Syntax errors
- Missing environment validation

### 3. Security & Secrets Scan
**Purpose**: Prevents credential leaks and validates security configuration

**Key Checks**:
- Gitleaks secret detection
- .env.example presence
- .gitignore completeness
- API key pattern detection

**Failure Conditions**:
- Exposed secrets in git history
- Missing security files
- Unprotected sensitive patterns

### 4. Performance & Integration Tests
**Purpose**: Ensures framework performance remains within acceptable limits

**Key Checks**:
- Config load time < 100ms
- Total config size < 100KB
- Integration test suite passes
- Memory usage validation

**Failure Conditions**:
- Performance regression
- Integration failures
- Excessive resource usage

## 📊 Quality Gates

### Pass Criteria
- All 4 jobs complete successfully
- No security vulnerabilities detected
- Performance within benchmarks
- 100% test coverage on critical paths

### Fail Criteria
- Any job fails
- Secrets detected
- Performance regression > 20%
- Missing required files

## 🔧 Local Development

### Pre-commit Validation
```bash
# Run full validation locally
.github/workflows/validate-local.sh

# Individual checks
python -m pytest tests/claude/ -v
bash -n .claude/scripts/*.sh
gitleaks detect --source .
```

### Performance Benchmarking
```bash
# Measure config load time
python -c "
import time
start = time.time()
# Load all configs
load_time = time.time() - start
print(f'Load time: {load_time:.3f}s')
"
```

## 🚨 Failure Recovery

### Common Failures & Solutions

1. **Template Size Violation**
   ```bash
   # Check file sizes
   wc -l .claude/CLAUDE*.md
   # Split oversized files into modules
   ```

2. **Security Scan Failures**
   ```bash
   # Clean sensitive data
   git filter-branch --force --index-filter \
     'git rm --cached --ignore-unmatch .env' HEAD
   ```

3. **Performance Regression**
   ```bash
   # Profile config loading
   python -m cProfile -s cumtime config_loader.py
   ```

4. **MCP Script Failures**
   ```bash
   # Debug script issues
   bash -x .claude/scripts/problematic-script.sh
   ```

## 📈 Metrics & Monitoring

### Pipeline Metrics
- **Success Rate**: Target > 95%
- **Average Duration**: Target < 5 minutes
- **Flaky Test Rate**: Target < 2%

### Framework Health
- **Config Load Time**: < 100ms
- **Memory Usage**: < 50MB
- **Test Coverage**: > 90%
- **Security Score**: 0 vulnerabilities

## 🎛️ Pipeline Configuration

### Environment Variables
```yaml
env:
  PYTHONDONTWRITEBYTECODE: 1
  PYTEST_TIMEOUT: 300
  SECURITY_SCAN_LEVEL: strict
```

### Artifact Retention
- Validation reports: 30 days
- Performance benchmarks: 90 days
- Security scan results: 365 days

## 🔄 Continuous Improvement

### Weekly Reviews
- [ ] Analyze failure patterns
- [ ] Update performance baselines
- [ ] Review security scan results
- [ ] Optimize pipeline duration

### Monthly Optimizations
- [ ] Update dependency versions
- [ ] Refine quality gates
- [ ] Enhance test coverage
- [ ] Performance tuning

## 🔗 Integration Points

### GitHub Integration
- Status checks block merge on failure
- Automated PR comments with results
- Branch protection rules enforced

### External Tools
- **Gitleaks**: Secret detection
- **pytest**: Test execution
- **BeautifulSoup**: Markdown validation
- **psutil**: Performance monitoring

## 🛠️ Troubleshooting

### Debug Failed Runs
```bash
# Download workflow logs
gh run download <run-id>

# Reproduce locally
act -j validate_templates_syntax

# Check specific test
python -m pytest tests/claude/test_templates_syntax.py::test_specific -vv
```

### Performance Issues
```bash
# Profile pipeline steps
time python -m pytest tests/claude/
time bash -n .claude/scripts/*.sh
time gitleaks detect --source .
```

---
**Version**: 1.0.0  
**Compatibility**: GitHub Actions, Claude v4.1+  
**Maintenance**: Weekly review required