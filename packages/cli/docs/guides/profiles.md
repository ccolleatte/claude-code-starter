# Security Profiles Guide

Claude Stack CLI offers three security profiles designed for different project needs and security requirements. This guide helps you understand each profile and choose the right one for your project.

## 🎯 Profile Overview

| Profile | Best For | Security Level | Complexity | Maintenance |
|---------|----------|----------------|------------|-------------|
| **Starter** | Learning, personal projects | Basic | Low | Minimal |
| **Standard** | Production apps, teams | High | Medium | Moderate |
| **Enterprise** | Large orgs, compliance | Maximum | High | Managed |

## 🚀 Starter Profile

**Perfect for**: Personal projects, learning, quick prototypes, open source side projects

### What's Included

#### Core Tools
- **Jest** - Testing framework with basic configuration
- **ESLint** - Code linting with recommended rules
- **Prettier** - Code formatting with sensible defaults

#### Features
- ✅ Basic test setup and coverage reporting
- ✅ Code quality enforcement
- ✅ Auto-formatting on save
- ✅ Basic .gitignore configuration
- ✅ Claude Code integration (MCP + hooks)

#### Configuration Example
```yaml
# .claude-stack.yml
name: my-starter-project
profile: starter
components:
  testing:
    enabled: true
    tools: [jest]
    configuration:
      coverage_threshold: 70
  quality:
    enabled: true
    tools: [eslint, prettier]
    configuration:
      eslint_extends: ["eslint:recommended"]
```

### When to Choose Starter

- 🎓 **Learning**: Great for understanding security fundamentals
- 🚀 **Prototyping**: Quick setup without overwhelming configuration
- 👤 **Personal Projects**: Individual projects with basic quality needs
- 💰 **Cost-Conscious**: Minimal overhead and maintenance

### Getting Started with Starter

```bash
# Initialize with starter profile
claude-stack init --profile=starter

# What gets created:
# ├── .claude/
# │   ├── mcp.json          # Basic Claude Code integration
# │   └── hooks.json        # Auto-formatting hooks
# ├── .claude-stack.yml     # Starter configuration
# ├── .eslintrc.json        # Basic linting rules
# ├── .prettierrc.json      # Code formatting
# ├── jest.config.json      # Testing setup
# └── .gitignore           # Essential ignores

# Run your first audit
claude-stack audit
```

## ⭐ Standard Profile (Recommended)

**Perfect for**: Production applications, team collaboration, CI/CD pipelines, security-conscious projects

### What's Included

#### All Starter Tools +
- **Semgrep** - Static Application Security Testing (SAST)
- **Gitleaks** - Secret detection and prevention
- **npm audit** - Dependency vulnerability scanning
- **GitHub Actions** - Automated CI/CD workflows

#### Advanced Features
- 🔒 **Security Scanning**: Automated vulnerability detection
- 🔑 **Secret Prevention**: Pre-commit and CI secret scanning
- 📊 **Dependency Monitoring**: Continuous vulnerability tracking
- 🚀 **CI/CD Integration**: Ready-to-use GitHub Actions workflows
- 📋 **Security Reporting**: Automated security status reports

#### Generated Workflows
```yaml
# .github/workflows/security.yml
name: Security Scan
on: [push, pull_request]
jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm audit
      - run: npx semgrep --config=auto .
      - run: npx gitleaks detect
```

### Advanced Configuration

```yaml
# .claude-stack.yml
name: my-standard-project
profile: standard
components:
  testing:
    enabled: true
    tools: [jest]
    configuration:
      coverage_threshold: 80
      branch_coverage: 75
  security:
    enabled: true
    tools: [semgrep, gitleaks]
    configuration:
      severity: medium
      exclude_patterns: ["test/**", "*.test.js"]
  quality:
    enabled: true
    tools: [eslint, prettier]
    configuration:
      eslint_extends: ["eslint:recommended", "@typescript-eslint/recommended"]
settings:
  autoFix: true
  notifications:
    slack:
      enabled: false
      webhook: ""
```

### When to Choose Standard

- 🏢 **Production Apps**: Applications used by real users
- 👥 **Team Projects**: Multiple developers working together
- 🔄 **CI/CD Pipelines**: Automated testing and deployment
- 🛡️ **Security Focus**: Applications handling sensitive data
- 📈 **Growing Projects**: Scaling from prototype to production

### Migration from Starter

```bash
# Upgrade existing starter project
claude-stack profile migrate standard

# Review migration plan
claude-stack profile compare starter standard

# What changes:
# ✅ Adds Semgrep security scanning
# ✅ Adds Gitleaks secret detection
# ✅ Creates GitHub Actions workflows
# ✅ Enhanced ESLint configuration
# ✅ Dependency vulnerability monitoring
# ✅ Security policy documentation
```

## 🏢 Enterprise Profile

**Perfect for**: Large-scale applications, regulated industries, compliance requirements, multi-team organizations

### What's Included

#### All Standard Tools +
- **Syft & Grype** - Software Composition Analysis (SCA)
- **Trivy** - Container and filesystem scanning
- **OPA (Open Policy Agent)** - Policy as code enforcement
- **Advanced Governance** - Compliance monitoring and reporting

#### Enterprise Features
- 🔍 **Software Composition Analysis**: Complete SBOM generation
- 🐳 **Container Security**: Multi-layer container scanning
- 📋 **Policy Enforcement**: Custom governance rules
- 📊 **Compliance Reporting**: SOC2, PCI-DSS, GDPR ready
- 🔒 **Advanced Threat Detection**: ML-powered security analysis
- 📈 **Security Metrics**: Comprehensive dashboards and KPIs

#### Advanced Security Stack
```yaml
# Complete enterprise security configuration
components:
  testing:
    enabled: true
    tools: [jest, playwright]
    configuration:
      coverage_threshold: 90
      e2e_tests: true
  security:
    enabled: true
    tools: [semgrep, gitleaks, syft, grype, trivy]
    configuration:
      severity: high
      custom_rules: true
      threat_modeling: true
  quality:
    enabled: true
    tools: [eslint, prettier, sonarqube]
    configuration:
      custom_rules: "enterprise-rules"
  observability:
    enabled: true
    tools: [prometheus, grafana, jaeger]
    configuration:
      metrics_collection: true
      distributed_tracing: true
  governance:
    enabled: true
    tools: [opa, falco]
    configuration:
      policy_enforcement: strict
      compliance_frameworks: [soc2, pci-dss]
```

### Enterprise Workflows

```yaml
# .github/workflows/enterprise-security.yml
name: Enterprise Security Suite
on: [push, pull_request]
jobs:
  comprehensive-security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      # Software Composition Analysis
      - name: Generate SBOM
        run: syft packages . -o json=sbom.json

      - name: Vulnerability Scan
        run: grype sbom.json

      # Container Security
      - name: Container Scan
        run: trivy fs .

      # Policy Enforcement
      - name: Policy Check
        run: opa test policies/

      # Compliance Reporting
      - name: Generate Compliance Report
        run: claude-stack compliance-report --framework=soc2
```

### When to Choose Enterprise

- 🏛️ **Regulated Industries**: Finance, healthcare, government
- 📋 **Compliance Requirements**: SOC2, PCI-DSS, HIPAA, GDPR
- 🌐 **Large Organizations**: 50+ developers, multiple teams
- 🔒 **High Security Needs**: Critical infrastructure, sensitive data
- 📊 **Advanced Monitoring**: Comprehensive security metrics needed

### Enterprise Migration Strategy

```bash
# Gradual migration approach
claude-stack profile show enterprise
claude-stack profile compare standard enterprise

# Phase 1: Add SCA tools
claude-stack config set components.security.tools '["semgrep", "gitleaks", "syft", "grype"]'

# Phase 2: Add container scanning
claude-stack generate docker --template security-hardened

# Phase 3: Implement policy as code
claude-stack generate opa --template baseline-policies

# Phase 4: Full migration
claude-stack profile migrate enterprise
```

## 🔄 Profile Comparison

### Feature Matrix

| Feature | Starter | Standard | Enterprise |
|---------|---------|----------|------------|
| **Testing Framework** | Jest | Jest + Coverage | Jest + E2E + Performance |
| **Code Quality** | ESLint + Prettier | Enhanced Rules | Custom + SonarQube |
| **SAST Scanning** | ❌ | Semgrep | Semgrep + Custom Rules |
| **Secret Detection** | ❌ | Gitleaks | Gitleaks + Advanced |
| **Dependency Scanning** | ❌ | npm audit | SCA + Licensing |
| **Container Security** | ❌ | ❌ | Trivy + Policies |
| **CI/CD Workflows** | Basic | GitHub Actions | Enterprise Pipelines |
| **Compliance** | ❌ | ❌ | SOC2 + PCI-DSS + Custom |
| **Policy Enforcement** | ❌ | ❌ | OPA + Custom Policies |
| **Monitoring** | ❌ | Basic | Full Observability |

### Performance Impact

| Profile | Setup Time | CI/CD Time | Maintenance | Learning Curve |
|---------|------------|------------|-------------|----------------|
| **Starter** | < 1 min | 2-3 min | Minimal | Easy |
| **Standard** | 2-3 min | 5-8 min | Weekly | Moderate |
| **Enterprise** | 5-10 min | 10-15 min | Daily | Advanced |

## 🚀 Choosing Your Profile

### Decision Tree

```
Do you need compliance frameworks? (SOC2, PCI-DSS, etc.)
├── Yes → Enterprise Profile
└── No
    ├── Is this a production application with a team?
    │   ├── Yes → Standard Profile
    │   └── No → Starter Profile
    └── Do you handle sensitive user data?
        ├── Yes → Standard Profile
        └── No → Starter Profile
```

### Migration Path

**Recommended progression**: Starter → Standard → Enterprise

```bash
# Start simple
claude-stack init --profile=starter

# Upgrade when ready for production
claude-stack profile migrate standard

# Scale to enterprise when compliance is needed
claude-stack profile migrate enterprise
```

### Custom Profiles

You can also create custom profiles by mixing components:

```bash
# Start with starter, add specific tools
claude-stack init --profile=starter
claude-stack config set components.security.enabled true
claude-stack config set components.security.tools '["semgrep"]'

# Or create completely custom configuration
claude-stack init --profile=standard
claude-stack config set components.governance.enabled true
claude-stack config set components.governance.tools '["opa"]'
```

## 🔧 Profile Management

### Viewing Profiles
```bash
# List all available profiles
claude-stack profile list

# Show detailed profile information
claude-stack profile show enterprise

# Compare two profiles
claude-stack profile compare starter standard
```

### Migration Commands
```bash
# Check current profile
claude-stack status

# Preview migration changes
claude-stack profile migrate standard --dry-run

# Perform migration
claude-stack profile migrate standard

# Rollback if needed (uses backup)
cp .claude-stack.yml.backup .claude-stack.yml
```

### Profile Customization
```bash
# View current configuration
claude-stack config list

# Customize specific component
claude-stack config set components.testing.configuration.coverage_threshold 85

# Add notification settings
claude-stack config set notifications.slack.enabled true
claude-stack config set notifications.slack.webhook "your-webhook-url"
```

## 💡 Best Practices

### Profile Selection
1. **Start Conservative**: Begin with Starter, upgrade as needed
2. **Match Requirements**: Choose based on actual security needs
3. **Consider Team Size**: Larger teams benefit from Standard+
4. **Plan for Growth**: Consider future requirements

### Migration Strategy
1. **Test in Branch**: Create a branch for profile migration
2. **Gradual Rollout**: Don't migrate everything at once
3. **Monitor Impact**: Watch CI/CD times and developer experience
4. **Train Team**: Ensure team understands new tools

### Maintenance
1. **Regular Audits**: Run `claude-stack audit` regularly
2. **Stay Updated**: Use `claude-stack upgrade` for updates
3. **Monitor Metrics**: Track security improvements over time
4. **Customize Gradually**: Start with defaults, customize as you learn

---

**Next Steps**:
- [Quick Start](../getting-started/quick-start.md) - Initialize your project
- [Security Management](security.md) - Advanced security configuration
- [Command Reference](../commands/) - Learn specific commands