# Claude Stack CLI Documentation

Welcome to the comprehensive documentation for Claude Stack CLI - the automated security stack management tool for Claude Code projects.

## 🚀 Quick Navigation

### Getting Started
- [Installation](getting-started/installation.md) - Install and setup Claude Stack CLI
- [Quick Start](getting-started/quick-start.md) - Get up and running in 5 minutes
- [Your First Project](getting-started/first-project.md) - Step-by-step project creation

### User Guides
- [Security Profiles](guides/profiles.md) - Understanding starter, standard, and enterprise profiles
- [Security Management](guides/security.md) - Advanced security configuration and best practices
- [CI/CD Integration](guides/ci-cd.md) - Integrate with GitHub Actions, GitLab CI, and other platforms
- [Project Migration](guides/migration.md) - Migrate existing projects to Claude Stack

### Command Reference
- [init](commands/init.md) - Initialize Claude Stack in your project
- [audit](commands/audit.md) - Run comprehensive security audits
- [upgrade](commands/upgrade.md) - Update components and migrate configurations
- [status](commands/status.md) - Check project health and component status
- [doctor](commands/doctor.md) - Diagnose and fix common issues
- [config](commands/config.md) - Manage global and project configurations
- [profile](commands/profile.md) - View, compare, and migrate between profiles
- [generate](commands/generate.md) - Generate workflows, hooks, and configuration files
- [validate](commands/validate.md) - Validate configurations and project structure
- [clean](commands/clean.md) - Clean up caches, artifacts, and temporary files
- [info](commands/info.md) - Display system and project information

### Configuration
- [Profile Configuration](configuration/profiles.md) - Detailed profile configuration options
- [Custom Configuration](configuration/custom.md) - Advanced customization and overrides
- [Claude Code Integration](configuration/claude-integration.md) - MCP servers and hooks setup

### Troubleshooting
- [Common Issues](troubleshooting/common-issues.md) - Solutions to frequent problems
- [Diagnostic Tools](troubleshooting/diagnostics.md) - Using doctor command and debugging
- [Getting Support](troubleshooting/support.md) - Community resources and bug reporting

## 🎯 Use Cases

### For Individuals
- **Personal Projects**: Quick security setup with minimal configuration
- **Learning**: Understand security best practices through automated tooling
- **Prototyping**: Rapid secure project scaffolding

### For Teams
- **Standardization**: Consistent security practices across team projects
- **Onboarding**: New developers get secure setup automatically
- **Compliance**: Automated adherence to security policies

### For Organizations
- **Governance**: Enterprise-grade security and compliance monitoring
- **Audit Trail**: Complete visibility into security posture
- **Policy Enforcement**: Automated policy as code implementation

## 🏗️ Architecture Overview

```
Claude Stack CLI
├── Profiles System          # Pre-configured security levels
├── Component Management     # Modular tool configuration
├── Auto-Fix Engine         # Intelligent issue resolution
├── Migration System        # Safe profile transitions
├── Claude Code Integration # MCP + Hooks automation
└── Multi-Platform Support  # Windows/Linux/macOS
```

## 📊 Security Components

| Component | Starter | Standard | Enterprise | Purpose |
|-----------|---------|----------|------------|---------|
| **Testing** | ✅ Jest | ✅ Jest + Coverage | ✅ Advanced Testing | Unit/Integration testing |
| **Code Quality** | ✅ ESLint/Prettier | ✅ Enhanced Rules | ✅ Custom Rules | Code standards enforcement |
| **SAST** | ❌ | ✅ Semgrep | ✅ Semgrep + Custom | Static security analysis |
| **Secrets** | ❌ | ✅ Gitleaks | ✅ Gitleaks + Policies | Secret detection/prevention |
| **Dependencies** | ❌ | ✅ npm audit | ✅ SCA + Licensing | Vulnerability management |
| **Containers** | ❌ | ❌ | ✅ Trivy | Container security scanning |
| **Governance** | ❌ | ❌ | ✅ OPA + Policies | Policy as code enforcement |

## 🔗 Integration Ecosystem

### Development Tools
- **Claude Code**: Native MCP and hooks integration
- **VS Code**: Extension recommendations and settings
- **Git**: Pre-commit hooks and workflow automation

### CI/CD Platforms
- **GitHub Actions**: Automated workflow generation
- **GitLab CI**: Pipeline templates and security scanning
- **Azure DevOps**: Build and release automation
- **Jenkins**: Plugin compatibility and job templates

### Security Tools
- **Semgrep**: Static analysis security testing
- **Gitleaks**: Secret detection and prevention
- **Trivy**: Container and filesystem scanning
- **Syft & Grype**: Software composition analysis

## 📈 Getting the Most Out of Claude Stack

### Best Practices
1. **Start with Standard Profile** - Balances security and usability
2. **Enable Auto-Fix** - Let Claude Stack maintain your security posture
3. **Regular Audits** - Run `claude-stack audit` in your CI pipeline
4. **Monitor Upgrades** - Use `--dry-run` to preview changes
5. **Customize Gradually** - Start with defaults, then customize as needed

### Common Workflows
```bash
# New project setup
claude-stack init --profile=standard
git add . && git commit -m "Initial Claude Stack setup"

# Daily development
claude-stack audit --auto-fix  # Before commits
claude-stack status           # Health check

# Weekly maintenance
claude-stack upgrade --dry-run  # Check for updates
claude-stack doctor             # System health
```

## 🤝 Contributing

We welcome contributions to both the CLI and documentation! See our [Contributing Guide](../CONTRIBUTING.md) for details on:

- Reporting bugs and feature requests
- Contributing code improvements
- Improving documentation
- Adding new security tools integration

## 📞 Support

- **Documentation**: You're reading it! Check specific sections for detailed guidance
- **CLI Help**: Run `claude-stack --help` or `claude-stack [command] --help`
- **Issues**: [GitHub Issues](https://github.com/anthropics/claude-stack-cli/issues)
- **Discussions**: [GitHub Discussions](https://github.com/anthropics/claude-stack-cli/discussions)

---

**Next Steps**: Start with [Installation](getting-started/installation.md) or jump to [Quick Start](getting-started/quick-start.md) if you're ready to dive in!