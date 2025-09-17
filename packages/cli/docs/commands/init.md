# claude-stack init

Initialize Claude Stack in your project with automated security configuration.

## Overview

The `init` command sets up a complete security stack for your project, including testing, linting, security scanning, and Claude Code integration. It's designed to be safe for both new and existing projects.

## Syntax

```bash
claude-stack init [options]
```

## Options

| Option | Description | Default |
|--------|-------------|---------|
| `-p, --profile <profile>` | Security profile (starter\|standard\|enterprise) | Interactive prompt |
| `-n, --project-name <name>` | Project name | Auto-detected from package.json or directory |
| `-s, --skip-interactive` | Skip interactive prompts | `false` |
| `-d, --dry-run` | Show what would be done without making changes | `false` |
| `-f, --force` | Force initialization even if already initialized | `false` |

## Examples

### Basic Usage

```bash
# Interactive initialization (recommended)
claude-stack init

# Quick setup with specific profile
claude-stack init --profile=standard

# Initialize with custom project name
claude-stack init --profile=standard --project-name="my-secure-app"
```

### Advanced Usage

```bash
# Preview what will be created
claude-stack init --dry-run --profile=enterprise

# Force reinitialize existing project
claude-stack init --force --profile=standard

# Non-interactive setup for CI/CD
claude-stack init --skip-interactive --profile=standard --project-name="ci-project"
```

## What Gets Created

### File Structure

After running `claude-stack init`, your project will have:

```
your-project/
├── .claude/                    # Claude Code integration
│   ├── mcp.json               # MCP servers configuration
│   └── hooks.json             # Auto-formatting and security hooks
├── .claude-stack.yml          # Main Claude Stack configuration
├── .github/workflows/         # Automated CI/CD workflows
│   ├── test.yml              # Testing workflow
│   ├── security.yml          # Security scanning (standard+)
│   └── claude-stack.yml      # Maintenance workflow
├── .eslintrc.json            # Code linting configuration
├── .prettierrc.json          # Code formatting configuration
├── jest.config.json          # Testing configuration
├── .gitignore                # Updated with security patterns
├── SECURITY.md               # Security policy (standard+)
└── README.md                 # Updated with Claude Stack info
```

### Configuration Files

#### .claude-stack.yml
```yaml
name: my-project
profile: standard
version: 1.0.0
created: 2024-01-15T10:30:00.000Z
components:
  testing:
    enabled: true
    tools: [jest]
    configuration:
      coverage_threshold: 80
  security:
    enabled: true
    tools: [semgrep, gitleaks]
    configuration:
      severity: medium
  quality:
    enabled: true
    tools: [eslint, prettier]
    configuration:
      eslint_extends: ["eslint:recommended"]
settings:
  autoFix: true
  notifications:
    slack:
      enabled: false
    email:
      enabled: false
```

#### .claude/mcp.json
```json
{
  "mcpServers": {
    "serena": {
      "type": "stdio",
      "command": "npx",
      "args": ["serena"],
      "env": {}
    },
    "cipher": {
      "type": "stdio",
      "command": "npx",
      "args": ["@byterover/cipher", "--mode", "mcp"],
      "env": {
        "CIPHER_WORKSPACE": "."
      }
    }
  }
}
```

#### .claude/hooks.json
```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "npx prettier --write $CLAUDE_FILE_PATHS"
          },
          {
            "type": "command",
            "command": "npx eslint --fix $CLAUDE_FILE_PATHS || true"
          }
        ]
      }
    ]
  }
}
```

## Interactive Mode

When run without options, `claude-stack init` enters interactive mode:

### Step 1: Project Detection
```
🔍 Analyzing project...
   ✅ Node.js project detected (package.json found)
   ✅ Git repository detected
   📁 Project name: my-awesome-app
   📦 Package manager: npm
```

### Step 2: Profile Selection
```
? Select a security profile:
❯ starter    - Essential tools (Jest, ESLint, Prettier)
  standard   - Recommended (+ Semgrep, Gitleaks, CI/CD)
  enterprise - Full stack (+ Syft, Grype, Trivy, OPA)

ℹ️  Profile comparison:
   starter:    Quick setup, minimal overhead
   standard:   Production-ready, team collaboration
   enterprise: Compliance, advanced governance
```

### Step 3: Configuration Options
```
? Enable auto-fix for detected issues? (Y/n) Y
? Setup GitHub Actions workflows? (Y/n) Y
? Configure Claude Code integration? (Y/n) Y

📋 Configuration summary:
   Profile: standard
   Auto-fix: enabled
   CI/CD: GitHub Actions
   Claude Code: enabled
```

### Step 4: Installation
```
🚀 Initializing Claude Stack...
   📝 Creating configuration files...
   📦 Installing dependencies...
   🔧 Setting up tools...
   🎣 Configuring hooks...
   ✅ Initialization complete!
```

## Profile-Specific Behavior

### Starter Profile
```bash
claude-stack init --profile=starter
```

**What gets installed:**
- Jest for testing
- ESLint for code quality
- Prettier for formatting
- Basic Claude Code integration
- Minimal .gitignore updates

**Dependencies added:**
```json
{
  "devDependencies": {
    "jest": "^29.7.0",
    "eslint": "^8.51.0",
    "prettier": "^3.0.3"
  }
}
```

### Standard Profile
```bash
claude-stack init --profile=standard
```

**Additional tools:**
- Semgrep for security scanning
- Gitleaks for secret detection
- GitHub Actions workflows
- Enhanced ESLint configuration
- Security policy documentation

**Dependencies added:**
```json
{
  "devDependencies": {
    "jest": "^29.7.0",
    "eslint": "^8.51.0",
    "prettier": "^3.0.3",
    "semgrep": "^1.45.0"
  }
}
```

### Enterprise Profile
```bash
claude-stack init --profile=enterprise
```

**Additional enterprise tools:**
- Syft for SBOM generation
- Grype for vulnerability scanning
- Trivy for container scanning
- OPA for policy enforcement
- Advanced compliance workflows

## Existing Project Handling

Claude Stack safely handles existing projects:

### Package.json Merging
```javascript
// Existing package.json
{
  "scripts": {
    "start": "node server.js",
    "custom-test": "mocha"
  }
}

// After claude-stack init
{
  "scripts": {
    "start": "node server.js",      // Preserved
    "custom-test": "mocha",         // Preserved
    "test": "jest",                 // Added
    "lint": "eslint .",             // Added
    "format": "prettier --write ."  // Added
  }
}
```

### Configuration Merging
- **ESLint**: Extends existing configuration
- **Jest**: Merges with existing test setup
- **Prettier**: Preserves custom formatting rules
- **Git**: Appends to existing .gitignore

### Conflict Resolution
```bash
# If conflicts detected:
⚠️  Existing configuration detected:
   📄 .eslintrc.json already exists

? How should we handle existing ESLint config?
❯ Extend existing configuration
  Replace with Claude Stack configuration
  Skip ESLint setup
```

## Error Handling

### Common Errors and Solutions

#### "Not a Node.js project"
```bash
❌ Error: No package.json found

💡 Solution:
npm init -y
claude-stack init
```

#### "Permission denied"
```bash
❌ Error: EACCES: permission denied

💡 Solutions:
# Fix npm permissions
sudo chown -R $(whoami) $(npm config get prefix)/{lib/node_modules,bin,share}

# Or use npx
npx @claude/stack init
```

#### "Git repository required"
```bash
❌ Error: Not a git repository

💡 Solution:
git init
claude-stack init
```

#### "Unsupported package manager"
```bash
⚠️  Warning: pnpm detected but not fully supported

💡 Claude Stack works best with npm or yarn
   Consider switching or check documentation for pnpm usage
```

## Advanced Configuration

### Custom Profile Creation

```bash
# Start with base profile
claude-stack init --profile=starter

# Customize after initialization
claude-stack config set components.security.enabled true
claude-stack config set components.security.tools '["semgrep"]'

# Or edit .claude-stack.yml directly
```

### Environment-Specific Setup

```bash
# Development environment
claude-stack init --profile=standard

# Production/CI environment
claude-stack init --profile=standard --skip-interactive

# Enterprise compliance environment
claude-stack init --profile=enterprise
```

### Integration with Existing Tools

```bash
# Initialize alongside existing tools
claude-stack init --profile=starter

# Then selectively enable additional components
claude-stack config set components.security.tools '["eslint-plugin-security"]'
```

## Verification

After initialization, verify everything is working:

```bash
# Check Claude Stack status
claude-stack status

# Run initial audit
claude-stack audit

# Test the setup
npm test
npm run lint

# Verify Claude Code integration
# (if using Claude Code, check that MCP servers are loaded)
```

## Post-Initialization Steps

### 1. Review Generated Files
```bash
# Check main configuration
cat .claude-stack.yml

# Review security settings
cat SECURITY.md  # (if created)

# Verify CI/CD workflows
ls .github/workflows/
```

### 2. Customize Configuration
```bash
# Adjust security thresholds
claude-stack config set components.testing.configuration.coverage_threshold 85

# Enable notifications
claude-stack config set notifications.slack.enabled true
```

### 3. Run First Audit
```bash
# Comprehensive security check
claude-stack audit --auto-fix

# Check project health
claude-stack status
```

### 4. Commit Changes
```bash
git add .
git commit -m "Add Claude Stack security configuration

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>"
```

## Troubleshooting

### Initialization Fails

```bash
# Run diagnostics
claude-stack doctor

# Check detailed logs
claude-stack init --verbose

# Clean and retry
rm -rf .claude-stack.yml .claude/
claude-stack init --force
```

### Dependencies Not Installing

```bash
# Clear npm cache
npm cache clean --force

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Retry initialization
claude-stack init --force
```

### Configuration Conflicts

```bash
# Backup existing config
cp .eslintrc.json .eslintrc.json.backup

# Force clean initialization
claude-stack init --force

# Manually merge configurations if needed
```

## Related Commands

- [`claude-stack status`](status.md) - Check initialization results
- [`claude-stack audit`](audit.md) - Run security audit after init
- [`claude-stack profile`](profile.md) - Manage and migrate profiles
- [`claude-stack config`](config.md) - Customize configuration
- [`claude-stack doctor`](doctor.md) - Diagnose initialization issues

---

**Next Steps**: After initialization, run [`claude-stack audit`](audit.md) to verify your security setup!