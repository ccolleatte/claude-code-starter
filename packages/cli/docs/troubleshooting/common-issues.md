# Common Issues and Solutions

This guide covers the most frequently encountered issues when using Claude Stack CLI and their solutions.

## 🚨 Installation Issues

### "command not found: claude-stack"

**Symptoms:**
```bash
$ claude-stack --version
bash: claude-stack: command not found
```

**Causes & Solutions:**

#### 1. Global Installation Missing
```bash
# Check if installed globally
npm list -g @claude/stack

# If not found, install globally
npm install -g @claude/stack

# Verify installation
claude-stack --version
```

#### 2. PATH Issues
```bash
# Check npm global bin directory
npm config get prefix

# Add to PATH (Linux/macOS)
echo 'export PATH="$(npm config get prefix)/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc

# Add to PATH (Windows)
# Add npm global bin directory to system PATH via System Properties
```

#### 3. Permission Issues (Linux/macOS)
```bash
# Fix npm permissions
sudo chown -R $(whoami) $(npm config get prefix)/{lib/node_modules,bin,share}

# Alternative: use npx
npx @claude/stack --version
```

#### 4. Multiple Node Versions
```bash
# If using nvm, ensure consistent Node version
nvm use stable
npm install -g @claude/stack

# Or use npx to avoid global installation issues
npx @claude/stack init
```

### Node.js Version Compatibility

**Symptoms:**
```bash
Error: Claude Stack requires Node.js 18 or higher
Current version: v16.14.0
```

**Solutions:**

#### Update Node.js
```bash
# Using nvm (recommended)
nvm install --lts
nvm use --lts

# Using package manager
# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs

# macOS
brew install node

# Windows
# Download installer from nodejs.org
```

#### Check Compatibility
```bash
# Verify Node.js version
node --version  # Should be 18.0.0 or higher

# Verify npm version
npm --version   # Should be 8.0.0 or higher
```

### Network and Proxy Issues

**Symptoms:**
```bash
npm ERR! network request to https://registry.npmjs.org/@claude%2fstack failed
```

**Solutions:**

#### Configure npm Registry
```bash
# Check current registry
npm config get registry

# Set to official registry
npm config set registry https://registry.npmjs.org/

# Clear npm cache
npm cache clean --force
```

#### Corporate Proxy Setup
```bash
# Set proxy configuration
npm config set proxy http://proxy.company.com:8080
npm config set https-proxy http://proxy.company.com:8080

# With authentication
npm config set proxy http://username:password@proxy.company.com:8080
```

#### Alternative Installation
```bash
# Use yarn instead of npm
yarn global add @claude/stack

# Download and install manually
wget https://registry.npmjs.org/@claude/stack/-/stack-1.0.0.tgz
npm install -g stack-1.0.0.tgz
```

## 🔧 Initialization Issues

### "Not a Node.js project"

**Symptoms:**
```bash
❌ Error: No package.json found
Claude Stack requires a Node.js project
```

**Solutions:**

#### Initialize Node.js Project
```bash
# Create package.json
npm init -y

# Then initialize Claude Stack
claude-stack init
```

#### Existing Project Without package.json
```bash
# For non-Node.js projects, create minimal package.json
echo '{"name": "my-project", "version": "1.0.0"}' > package.json

# Initialize with basic profile
claude-stack init --profile=starter
```

### Git Repository Required

**Symptoms:**
```bash
❌ Error: Not a git repository
Claude Stack requires Git for proper operation
```

**Solutions:**

```bash
# Initialize Git repository
git init

# Add initial commit
git add package.json
git commit -m "Initial commit"

# Then initialize Claude Stack
claude-stack init
```

### Permission Denied Errors

**Symptoms:**
```bash
❌ Error: EACCES: permission denied, open '.claude-stack.yml'
```

**Solutions:**

#### Check Directory Permissions
```bash
# Verify write permissions
ls -la

# Fix directory permissions
chmod 755 .
chmod 644 package.json

# Ensure ownership
sudo chown -R $(whoami) .
```

#### Windows-Specific Issues
```powershell
# Run as Administrator
# Or check if directory is read-only
attrib -R . /S /D
```

### Existing Configuration Conflicts

**Symptoms:**
```bash
⚠️  Warning: Existing .eslintrc.json found
⚠️  Warning: Existing jest.config.js found
```

**Solutions:**

#### Safe Merge (Recommended)
```bash
# Let Claude Stack merge configurations
claude-stack init  # Choose "Extend existing" when prompted
```

#### Force Overwrite
```bash
# Backup existing configs
cp .eslintrc.json .eslintrc.json.backup
cp jest.config.js jest.config.js.backup

# Force clean initialization
claude-stack init --force
```

#### Manual Configuration
```bash
# Initialize without conflicting tools
claude-stack init --profile=starter

# Manually configure specific components
claude-stack config set components.quality.tools '["prettier"]'
```

## 🔍 Audit Issues

### Security Tools Not Found

**Symptoms:**
```bash
❌ Error: semgrep not found
   Install semgrep for SAST scanning
```

**Solutions:**

#### Install Missing Tools
```bash
# Install Semgrep
npm install --save-dev semgrep

# Or use pip
pip install semgrep

# Install Gitleaks
# Linux/macOS
brew install gitleaks

# Windows
choco install gitleaks
```

#### Update Profile Configuration
```bash
# Check which tools are expected
claude-stack profile show standard

# Remove unavailable tools temporarily
claude-stack config set components.security.tools '["npm-audit"]'
```

### False Positives in Security Scans

**Symptoms:**
```bash
🟡 MEDIUM: Hardcoded secret detected in test file
🟡 MEDIUM: SQL injection vulnerability in test code
```

**Solutions:**

#### Configure Exclusions
```bash
# Add exclusions to .claude-stack.yml
claude-stack config set components.security.configuration.exclude_patterns '["test/**", "*.test.js", "mock/**"]'
```

#### Semgrep Configuration
```yaml
# .semgrepignore
test/
tests/
__tests__/
*.test.js
*.spec.js
mock/
mocks/
fixtures/
```

#### Gitleaks Configuration
```toml
# .gitleaksignore
test-secret-key
mock-api-key
dummy-password
```

### Performance Issues During Audit

**Symptoms:**
```bash
# Audit taking very long time
🕐 Running security audit... (5+ minutes)
```

**Solutions:**

#### Optimize Scan Scope
```bash
# Exclude large directories
echo "node_modules/" >> .semgrepignore
echo "dist/" >> .semgrepignore
echo "coverage/" >> .semgrepignore

# Scan specific directories only
claude-stack audit --component security -- --include="src/**"
```

#### Parallel Processing
```bash
# Reduce scan intensity
claude-stack config set components.security.configuration.max_workers 2

# Or run components separately
claude-stack audit --component testing
claude-stack audit --component quality
```

## 🔄 Upgrade Issues

### Breaking Changes During Upgrade

**Symptoms:**
```bash
⚠️  WARNING: Breaking changes detected
   ESLint major version upgrade requires manual configuration
```

**Solutions:**

#### Use Dry Run First
```bash
# Always preview changes
claude-stack upgrade --dry-run

# Review breaking changes
claude-stack upgrade --dry-run | grep "BREAKING"
```

#### Gradual Upgrade
```bash
# Upgrade only non-breaking changes
claude-stack upgrade --safe-only

# Manually handle breaking changes
claude-stack config set components.quality.tools.eslint.version "^8.0.0"
```

#### Rollback if Needed
```bash
# Automatic backup is created
cp .claude-stack.yml.backup .claude-stack.yml

# Or use git
git checkout -- .claude-stack.yml
```

### Dependency Conflicts

**Symptoms:**
```bash
npm ERR! peer dep missing: eslint@>=8.0.0
npm ERR! conflicting versions of prettier
```

**Solutions:**

#### Resolve Peer Dependencies
```bash
# Install missing peer dependencies
npm install --save-dev eslint@^8.0.0

# Check for conflicts
npm ls

# Fix conflicts
npm install --save-dev prettier@latest
```

#### Clean Installation
```bash
# Remove node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Re-run Claude Stack upgrade
claude-stack upgrade
```

## 🏥 Doctor Command Issues

### System Diagnostics Failing

**Symptoms:**
```bash
❌ Node.js Environment ERROR
❌ Git Configuration ERROR
```

**Solutions:**

#### Fix Node.js Issues
```bash
# Reinstall Node.js
nvm install --lts --reinstall-packages-from=current

# Fix npm configuration
npm config delete prefix
npm config delete cache
```

#### Fix Git Issues
```bash
# Configure Git
git config --global user.name "Your Name"
git config --global user.email "your@email.com"

# Fix Git repository
git init
git add .
git commit -m "Initial commit"
```

### Auto-Fix Not Working

**Symptoms:**
```bash
claude-stack doctor --fix
⚠️  Could not auto-fix: Permission denied
```

**Solutions:**

#### Manual Fixes
```bash
# Fix permissions
sudo chown -R $(whoami) .

# Fix npm cache
npm cache clean --force

# Reinstall dependencies
rm -rf node_modules
npm install
```

## 📊 Status and Configuration Issues

### Status Shows Components as Unhealthy

**Symptoms:**
```bash
❌ security ERROR
❌ testing ERROR
```

**Solutions:**

#### Investigate Specific Issues
```bash
# Get detailed status
claude-stack status --verbose

# Check individual components
claude-stack audit --component security
claude-stack audit --component testing
```

#### Rebuild Configuration
```bash
# Reset to profile defaults
claude-stack profile migrate $(claude-stack config get profile)

# Or force reinitialization
claude-stack init --force
```

### Configuration Not Loading

**Symptoms:**
```bash
❌ Error: Invalid .claude-stack.yml
Parse error at line 15
```

**Solutions:**

#### Validate YAML Syntax
```bash
# Check YAML syntax
yamllint .claude-stack.yml

# Or use online validator
# Copy content to https://www.yamllint.com/
```

#### Restore from Backup
```bash
# Use automatic backup
cp .claude-stack.yml.backup .claude-stack.yml

# Or regenerate
claude-stack init --force
```

## 🐳 Docker and Container Issues

### Container Security Scanning Fails

**Symptoms:**
```bash
❌ Error: Docker not found
❌ Error: trivy command not found
```

**Solutions:**

#### Install Required Tools
```bash
# Install Docker
# Follow instructions at https://docs.docker.com/get-docker/

# Install Trivy
# Linux
curl -sfL https://raw.githubusercontent.com/aquasecurity/trivy/main/contrib/install.sh | sh -s -- -b /usr/local/bin

# macOS
brew install trivy

# Windows
choco install trivy
```

#### Configure for Non-Docker Projects
```bash
# Disable container scanning
claude-stack config set components.security.tools '["semgrep", "gitleaks"]'

# Or use file system scanning only
claude-stack config set components.security.configuration.container_scan false
```

## 🔗 Claude Code Integration Issues

### MCP Servers Not Loading

**Symptoms:**
```bash
Claude Code shows: MCP server 'serena' failed to start
```

**Solutions:**

#### Check MCP Configuration
```bash
# Verify MCP configuration
cat .claude/mcp.json

# Test MCP server manually
npx serena --version
```

#### Regenerate MCP Configuration
```bash
# Regenerate Claude Code integration
claude-stack generate config --template mcp

# Or reinitialize
claude-stack init --force
```

### Hooks Not Triggering

**Symptoms:**
Code changes don't trigger auto-formatting or linting

**Solutions:**

#### Check Hook Configuration
```bash
# Verify hooks configuration
cat .claude/hooks.json

# Test hook manually
npx prettier --write test.js
```

#### Regenerate Hooks
```bash
# Regenerate hooks configuration
claude-stack generate hook --template auto-format

# Or update existing hooks
claude-stack config set hooks.PostToolUse '[]'
claude-stack init --force
```

## 🆘 Getting Help

### When All Else Fails

#### 1. Run Full Diagnostics
```bash
# Comprehensive system check
claude-stack doctor --verbose

# Get detailed information
claude-stack info --json > claude-stack-debug.json
```

#### 2. Clean Slate Approach
```bash
# Backup important files
cp package.json package.json.backup
cp README.md README.md.backup

# Remove Claude Stack completely
rm -rf .claude-stack.yml .claude/ .github/workflows/claude-stack.yml

# Start fresh
claude-stack init --profile=starter
```

#### 3. Seek Community Help
- **GitHub Issues**: [Create an issue](https://github.com/anthropics/claude-stack-cli/issues)
- **GitHub Discussions**: [Ask questions](https://github.com/anthropics/claude-stack-cli/discussions)
- **Documentation**: Check [latest docs](https://docs.anthropic.com/claude-stack)

#### 4. Report Bugs
```bash
# Gather debug information
claude-stack info --json > debug-info.json
claude-stack doctor --verbose > doctor-output.txt

# Include in bug report:
# - Output of both commands above
# - Your .claude-stack.yml (remove sensitive data)
# - Steps to reproduce the issue
# - Expected vs actual behavior
```

## 📞 Support Resources

- **CLI Help**: `claude-stack --help` or `claude-stack [command] --help`
- **Documentation**: [Full documentation](../README.md)
- **Diagnostics**: [`claude-stack doctor`](../commands/doctor.md)
- **System Info**: [`claude-stack info`](../commands/info.md)
- **GitHub Issues**: [Report bugs](https://github.com/anthropics/claude-stack-cli/issues)
- **Community**: [GitHub Discussions](https://github.com/anthropics/claude-stack-cli/discussions)

---

**Remember**: Most issues can be resolved with `claude-stack doctor --fix` or by running `claude-stack init --force` to reset configuration!