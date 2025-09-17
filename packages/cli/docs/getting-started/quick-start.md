# Quick Start Guide

Get Claude Stack CLI up and running in your project in under 5 minutes!

## 🚀 TL;DR - Super Quick Start

```bash
# Install globally
npm install -g @claude/stack

# Initialize in your project
cd your-project
claude-stack init --profile=standard

# Run security audit
claude-stack audit --auto-fix

# Check status
claude-stack status
```

That's it! Your project now has enterprise-grade security. 🎉

## 📋 Step-by-Step Walkthrough

### Step 1: Installation
```bash
# Global installation (recommended)
npm install -g @claude/stack

# Verify installation
claude-stack --version
```

### Step 2: Project Setup

#### For New Projects
```bash
# Create new project
mkdir my-secure-app && cd my-secure-app
npm init -y

# Initialize Claude Stack
claude-stack init
```

#### For Existing Projects
```bash
# Navigate to existing project
cd existing-project

# Initialize Claude Stack (safe for existing projects)
claude-stack init --force
```

### Step 3: Choose Your Security Profile

When you run `claude-stack init`, you'll be prompted to choose a profile:

```
? Select a security profile:
❯ starter    - Essential tools (Jest, ESLint, Prettier)
  standard   - Recommended (+ Semgrep, Gitleaks, CI/CD) [RECOMMENDED]
  enterprise - Full stack (+ Syft, Grype, Trivy, OPA)
```

**Recommendation**: Start with **Standard** profile for most projects.

### Step 4: What Gets Created

After initialization, Claude Stack creates:

```
your-project/
├── .claude/                    # Claude Code integration
│   ├── mcp.json               # MCP servers configuration
│   └── hooks.json             # Code hooks (auto-format, lint)
├── .claude-stack.yml          # Main configuration
├── .github/workflows/         # CI/CD automation
│   ├── test.yml              # Testing workflow
│   ├── security.yml          # Security scanning
│   └── claude-stack.yml      # Maintenance workflow
├── .eslintrc.json            # Code linting rules
├── .prettierrc.json          # Code formatting rules
├── jest.config.json          # Testing configuration
├── .gitignore                # Git ignore rules
└── SECURITY.md               # Security policy
```

### Step 5: First Security Audit

```bash
# Run comprehensive security audit
claude-stack audit

# Auto-fix detected issues
claude-stack audit --auto-fix
```

Expected output:
```
🔍 Claude Stack Audit

📊 Audit Results:

✅ testing HEALTHY
✅ security HEALTHY
⚠️  quality WARNING
   🟡 MEDIUM: ESLint violations found
      Fix: Run: npx eslint . --fix

✅ dependencies HEALTHY
✅ configuration HEALTHY

📋 Summary:
   Components: 5 total, 4 healthy, 1 warnings, 0 errors
   Issues: 3 total, 2 auto-fixable
```

### Step 6: Check Project Status

```bash
claude-stack status --verbose
```

This shows the health of all security components and provides recommendations.

## 🎯 Common First-Time Scenarios

### Scenario 1: React/Vue/Angular Project

```bash
# In your frontend project
cd my-react-app
claude-stack init --profile=standard

# The CLI detects frontend frameworks and adjusts:
# ✅ Adds React-specific ESLint rules
# ✅ Configures Jest for JSX/TSX
# ✅ Sets up proper .gitignore
# ✅ Adds security headers workflow
```

### Scenario 2: Node.js API Project

```bash
# In your API project
cd my-api
claude-stack init --profile=standard

# Optimized for backend:
# ✅ Adds Express security middleware suggestions
# ✅ Configures environment variable scanning
# ✅ Sets up API security testing
# ✅ Adds dependency vulnerability monitoring
```

### Scenario 3: Existing Project with Tests

```bash
cd project-with-tests
claude-stack init --force

# The CLI preserves existing configuration:
# ✅ Merges with existing package.json scripts
# ✅ Extends current ESLint configuration
# ✅ Keeps existing test files and structure
# ✅ Adds security on top of existing setup
```

### Scenario 4: Enterprise/Compliance Project

```bash
cd enterprise-project
claude-stack init --profile=enterprise

# Full governance setup:
# ✅ Advanced security scanning (Semgrep + Trivy)
# ✅ Software composition analysis (Syft + Grype)
# ✅ Policy as code (OPA integration)
# ✅ Compliance reporting and monitoring
```

## 🔄 Daily Workflow Integration

### Before Committing Code
```bash
# Quick health check and auto-fix
claude-stack audit --auto-fix

# If using git hooks (automatically configured):
git add .
git commit -m "Your changes"  # Triggers auto-format and security checks
```

### Weekly Maintenance
```bash
# Check for updates (safe preview)
claude-stack upgrade --dry-run

# Apply updates if desired
claude-stack upgrade

# Run comprehensive diagnostics
claude-stack doctor
```

### CI/CD Integration (Automatic)

Your GitHub Actions workflows are automatically configured to:

```yaml
# On every push/PR:
- Run tests
- Security scanning
- Code quality checks
- Dependency vulnerability scanning

# Weekly:
- Update security tools
- Check for Claude Stack updates
- Generate compliance reports
```

## 🛠️ Customization Quick Tips

### Adjust Security Rules
```bash
# View current configuration
claude-stack config list

# Adjust audit sensitivity
claude-stack config set audit.severity high

# Enable Slack notifications
claude-stack config set notifications.slack.enabled true
claude-stack config set notifications.slack.webhook "your-webhook-url"
```

### Generate Additional Files
```bash
# Add Docker support
claude-stack generate docker --template dockerfile

# Add API documentation template
claude-stack generate docs --template api-documentation

# Add additional GitHub workflow
claude-stack generate workflow --template deploy-production
```

### Migrate Between Profiles
```bash
# Upgrade from starter to standard
claude-stack profile migrate standard

# Compare profiles before migrating
claude-stack profile compare starter standard
```

## 🚨 Troubleshooting Quick Fixes

### "Command not found"
```bash
# Check installation
npm list -g @claude/stack

# Reinstall if needed
npm install -g @claude/stack --force
```

### "Permission denied"
```bash
# Fix npm permissions (macOS/Linux)
sudo chown -R $(whoami) $(npm config get prefix)/{lib/node_modules,bin,share}

# Or use npx
npx @claude/stack init
```

### "Configuration errors"
```bash
# Run diagnostics
claude-stack doctor --fix

# Validate configuration
claude-stack validate

# Reset to defaults if needed
claude-stack config reset
```

## ✅ Verification Checklist

After quick start, verify everything is working:

- [ ] `claude-stack status` shows all components healthy
- [ ] `npm test` runs successfully
- [ ] `npm run lint` passes without errors
- [ ] Git commit triggers auto-formatting
- [ ] GitHub Actions workflows are running (if using GitHub)
- [ ] Security audit finds no critical issues

## 🎯 Next Steps

Now that you're up and running:

1. **[Learn the Profiles](../guides/profiles.md)** - Understand security levels
2. **[Command Reference](../commands/)** - Explore all available commands
3. **[Security Best Practices](../guides/security.md)** - Advanced security configuration
4. **[CI/CD Integration](../guides/ci-cd.md)** - Maximize automation benefits

## 💡 Pro Tips

- **Start Simple**: Begin with starter profile, upgrade later
- **Use Auto-Fix**: Let Claude Stack maintain your security posture automatically
- **Regular Audits**: Run `claude-stack audit` before important releases
- **Stay Updated**: Use `claude-stack upgrade --dry-run` to preview updates safely
- **Customize Gradually**: Start with defaults, then customize as you learn

---

**Need Help?** Run `claude-stack --help` or check [Troubleshooting](../troubleshooting/common-issues.md)!