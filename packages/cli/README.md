# Claude Stack CLI

**Automated security stack management for Claude Code projects**

Claude Stack CLI is a comprehensive tool that automates the setup, management, and maintenance of security stacks for software development projects. It provides three pre-configured profiles (starter, standard, enterprise) with automated tooling for testing, security scanning, code quality, observability, and governance.

## 🚀 Quick Start

```bash
# Install globally
npm install -g @claude/stack

# Initialize a new project
claude-stack init --profile standard

# Run security audit
claude-stack audit --auto-fix

# Check for updates
claude-stack upgrade --dry-run
```

## 📋 Features

### 🔧 Three Security Profiles

- **Starter**: Essential tools (Jest, ESLint, Prettier)
- **Standard**: Comprehensive security (+ Semgrep, Gitleaks, npm audit)
- **Enterprise**: Full governance (+ Syft, Grype, Trivy, OPA)

### 🛠️ Core Commands

- `init` - Initialize Claude Stack in your project
- `audit` - Run comprehensive security audits with auto-fix
- `upgrade` - Update components with intelligent migration
- `status` - Check project health and component status
- `doctor` - Diagnose and fix common issues
- `validate` - Validate configurations and project structure

### 🎯 Management Commands

- `config` - Manage global and project configurations
- `profile` - View, compare, and migrate between profiles
- `generate` - Generate workflows, hooks, and configuration files
- `clean` - Clean up caches, artifacts, and temporary files
- `info` - Display system and project information

### 🔗 Claude Code Integration

- Automatic MCP (Model Context Protocol) server configuration
- Pre-configured hooks for code formatting and security scanning
- Seamless integration with Claude Code's development workflow

## 📖 Usage

### Initialize a Project

```bash
# Interactive setup
claude-stack init

# Quick setup with specific profile
claude-stack init --profile enterprise --project-name "my-app"

# Force reinitialize existing project
claude-stack init --force
```

### Security & Quality Management

```bash
# Run comprehensive audit
claude-stack audit

# Auto-fix detected issues
claude-stack audit --auto-fix

# Audit specific component
claude-stack audit --component security

# Check project status
claude-stack status --verbose
```

### Profile Management

```bash
# List available profiles
claude-stack profile list

# Show profile details
claude-stack profile show enterprise

# Migrate to different profile
claude-stack profile migrate standard
```

### Updates & Maintenance

```bash
# Check for updates (dry run)
claude-stack upgrade --dry-run

# Apply safe updates
claude-stack upgrade

# Diagnose issues
claude-stack doctor --fix
```

### Code Generation

```bash
# Generate GitHub workflow
claude-stack generate workflow --template security-scan

# Generate Claude Code hooks
claude-stack generate hook --template auto-format

# Generate documentation
claude-stack generate docs --template api-documentation
```

## 🏗️ Project Structure

After initialization, Claude Stack creates:

```
.
├── .claude/                    # Claude Code configuration
│   ├── mcp.json               # MCP servers config
│   └── hooks.json             # Code hooks config
├── .claude-stack.yml          # Main configuration
├── .github/workflows/         # CI/CD workflows
├── .eslintrc.json            # Code linting
├── .prettierrc.json          # Code formatting
├── jest.config.json          # Testing configuration
└── SECURITY.md               # Security policy
```

## 🔧 Configuration

Claude Stack can be configured at both global and project levels:

```bash
# Set global configuration
claude-stack config set telemetry.enabled false --global

# Set project configuration
claude-stack config set audit.autoFix true

# View all configuration
claude-stack config list
```

### Configuration Options

- `audit.autoFix` - Enable automatic issue fixing
- `audit.severity` - Minimum severity level for alerts
- `notifications.slack.enabled` - Enable Slack notifications
- `upgrade.autoUpdate` - Automatically apply safe updates
- `telemetry.enabled` - Send anonymous usage statistics

## 🔍 Profiles Comparison

| Feature | Starter | Standard | Enterprise |
|---------|---------|----------|------------|
| Testing (Jest) | ✅ | ✅ | ✅ |
| Code Quality (ESLint/Prettier) | ✅ | ✅ | ✅ |
| SAST Scanning (Semgrep) | ❌ | ✅ | ✅ |
| Secret Detection (Gitleaks) | ❌ | ✅ | ✅ |
| Dependency Scanning | ❌ | ✅ | ✅ |
| SCA Analysis (Syft/Grype) | ❌ | ❌ | ✅ |
| Container Scanning (Trivy) | ❌ | ❌ | ✅ |
| Policy as Code (OPA) | ❌ | ❌ | ✅ |
| Compliance Monitoring | ❌ | ❌ | ✅ |

## 🚨 Security Features

### Static Analysis Security Testing (SAST)
- **Semgrep**: Detects security vulnerabilities, bugs, and anti-patterns
- **Custom Rules**: Industry-specific security rules
- **CI Integration**: Automated scanning in pull requests

### Secret Detection
- **Gitleaks**: Prevents secrets from being committed
- **Pre-commit Hooks**: Real-time secret scanning
- **Historical Scanning**: Audit existing codebase for exposed secrets

### Dependency Management
- **Vulnerability Scanning**: Continuous monitoring of dependencies
- **Auto-updates**: Automated security patches
- **License Compliance**: Track and manage open source licenses

### Enterprise Security (Enterprise Profile)
- **Software Composition Analysis**: Complete SBOM generation
- **Container Security**: Multi-layer container scanning
- **Policy Enforcement**: Custom governance rules
- **Compliance Reporting**: SOC2, PCI-DSS, GDPR ready

## 🔄 Continuous Integration

Claude Stack generates optimized CI/CD workflows:

### Basic CI Workflow
```yaml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm test
      - run: npm run lint
```

### Security Workflow
```yaml
name: Security
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

## 🩺 Troubleshooting

### Common Issues

**Command not found**
```bash
# Reinstall globally
npm install -g @claude/stack

# Check installation
claude-stack --version
```

**Permission errors**
```bash
# Fix npm permissions (macOS/Linux)
sudo chown -R $(whoami) $(npm config get prefix)/{lib/node_modules,bin,share}

# Use npx as alternative
npx @claude/stack init
```

**Configuration issues**
```bash
# Diagnose problems
claude-stack doctor

# Validate configuration
claude-stack validate

# Reset to defaults
claude-stack config reset
```

### Getting Help

```bash
# Show help
claude-stack --help

# Command-specific help
claude-stack audit --help

# System information
claude-stack info
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### Development Setup

```bash
# Clone repository
git clone https://github.com/anthropics/claude-stack-cli.git
cd claude-stack-cli

# Install dependencies
npm install

# Build project
npm run build

# Run in development
npm run dev -- init

# Run tests
npm test
```

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

## 🔗 Links

- [Documentation](https://docs.anthropic.com/claude-stack)
- [GitHub Repository](https://github.com/anthropics/claude-stack-cli)
- [Issue Tracker](https://github.com/anthropics/claude-stack-cli/issues)
- [Claude Code Documentation](https://docs.anthropic.com/claude-code)

---

**Built with ❤️ by the Claude Stack Team**