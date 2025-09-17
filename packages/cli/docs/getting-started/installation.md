# Installation Guide

This guide covers all the ways to install and set up Claude Stack CLI on your system.

## 🚀 Quick Install

### Prerequisites

- **Node.js 18+** (LTS recommended)
- **npm 8+** or **yarn 3+**
- **Git 2.0+**
- **Operating System**: Windows 10+, macOS 10.15+, or Linux

### Global Installation (Recommended)

```bash
# Install globally with npm
npm install -g @claude/stack

# Verify installation
claude-stack --version
claude-stack --help
```

### Project-Specific Installation

```bash
# Install as dev dependency
npm install --save-dev @claude/stack

# Use with npx
npx @claude/stack init
```

### Alternative Package Managers

```bash
# Using Yarn
yarn global add @claude/stack

# Using pnpm
pnpm install -g @claude/stack
```

## 🔧 System-Specific Setup

### Windows

#### Using Node.js Installer
1. Download Node.js from [nodejs.org](https://nodejs.org/)
2. Run installer with default options
3. Open Command Prompt or PowerShell
4. Install Claude Stack CLI:
   ```cmd
   npm install -g @claude/stack
   ```

#### Using Chocolatey
```powershell
# Install Node.js
choco install nodejs

# Install Claude Stack CLI
npm install -g @claude/stack
```

#### Using winget
```powershell
# Install Node.js
winget install OpenJS.NodeJS

# Install Claude Stack CLI
npm install -g @claude/stack
```

#### Troubleshooting Windows
- **Permission Issues**: Run as Administrator or use `--unsafe-perm` flag
- **Path Issues**: Restart terminal after Node.js installation
- **Execution Policy**: Set PowerShell execution policy if needed:
  ```powershell
  Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
  ```

### macOS

#### Using Homebrew (Recommended)
```bash
# Install Node.js
brew install node

# Install Claude Stack CLI
npm install -g @claude/stack
```

#### Using MacPorts
```bash
# Install Node.js
sudo port install nodejs18

# Install Claude Stack CLI
npm install -g @claude/stack
```

#### Using Node Version Manager (nvm)
```bash
# Install nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Install latest Node.js LTS
nvm install --lts
nvm use --lts

# Install Claude Stack CLI
npm install -g @claude/stack
```

### Linux

#### Ubuntu/Debian
```bash
# Update package index
sudo apt update

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Claude Stack CLI
npm install -g @claude/stack
```

#### CentOS/RHEL/Fedora
```bash
# Install Node.js
sudo dnf install npm nodejs

# Or using NodeSource repository
curl -fsSL https://rpm.nodesource.com/setup_lts.x | sudo bash -
sudo dnf install nodejs npm

# Install Claude Stack CLI
npm install -g @claude/stack
```

#### Arch Linux
```bash
# Install Node.js
sudo pacman -S nodejs npm

# Install Claude Stack CLI
npm install -g @claude/stack
```

#### Using Snap
```bash
# Install Node.js
sudo snap install node --classic

# Install Claude Stack CLI
npm install -g @claude/stack
```

## 🐳 Container Installation

### Docker

```dockerfile
# Dockerfile for Claude Stack CLI
FROM node:18-alpine

# Install Claude Stack CLI globally
RUN npm install -g @claude/stack

# Set working directory
WORKDIR /workspace

# Entry point
ENTRYPOINT ["claude-stack"]
CMD ["--help"]
```

```bash
# Build and run
docker build -t claude-stack-cli .
docker run -v $(pwd):/workspace claude-stack-cli init
```

### Pre-built Docker Image
```bash
# Pull official image (when available)
docker pull anthropic/claude-stack-cli

# Run in current directory
docker run -v $(pwd):/workspace anthropic/claude-stack-cli init
```

## 🔧 Development Installation

### From Source

```bash
# Clone repository
git clone https://github.com/anthropics/claude-stack-cli.git
cd claude-stack-cli

# Install dependencies
npm install

# Build project
npm run build

# Link for local development
npm link

# Verify installation
claude-stack --version
```

### For Contributors

```bash
# Fork and clone your fork
git clone https://github.com/YOUR_USERNAME/claude-stack-cli.git
cd claude-stack-cli

# Add upstream remote
git remote add upstream https://github.com/anthropics/claude-stack-cli.git

# Install dependencies
npm install

# Run in development mode
npm run dev -- init --help

# Run tests
npm test

# Build and test
npm run build
npm run lint
```

## ✅ Verification

### Basic Verification
```bash
# Check version
claude-stack --version

# Check help
claude-stack --help

# Test with info command
claude-stack info
```

### Comprehensive Test
```bash
# Create test directory
mkdir claude-stack-test && cd claude-stack-test

# Initialize npm project
npm init -y

# Test Claude Stack initialization
claude-stack init --profile=starter --project-name="test-project"

# Verify generated files
ls -la
cat .claude-stack.yml
```

## 🔄 Updates

### Automatic Updates
```bash
# Update to latest version
npm update -g @claude/stack

# Check for updates within CLI
claude-stack upgrade --dry-run
```

### Version Management
```bash
# Check current version
claude-stack --version

# Install specific version
npm install -g @claude/stack@1.2.3

# List available versions
npm view @claude/stack versions --json
```

## 🚨 Troubleshooting

### Common Issues

#### "command not found: claude-stack"
```bash
# Check if npm global bin is in PATH
npm config get prefix
echo $PATH

# Add to PATH if needed (Linux/macOS)
echo 'export PATH="$(npm config get prefix)/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc
```

#### Permission Errors (Linux/macOS)
```bash
# Fix npm permissions
sudo chown -R $(whoami) $(npm config get prefix)/{lib/node_modules,bin,share}

# Or use npx
npx @claude/stack init
```

#### Node.js Version Issues
```bash
# Check Node.js version
node --version

# Upgrade if needed
nvm install --lts  # If using nvm
# or download from nodejs.org
```

#### Network Issues
```bash
# Check npm configuration
npm config list

# Set registry if needed
npm config set registry https://registry.npmjs.org/

# Install with verbose logging
npm install -g @claude/stack --verbose
```

### Getting Help
```bash
# Run diagnostics
claude-stack doctor

# Get system information
claude-stack info

# Check configuration
claude-stack config list
```

## 🔗 Next Steps

After successful installation:

1. **[Quick Start Guide](quick-start.md)** - Get started in 5 minutes
2. **[First Project](first-project.md)** - Create your first secure project
3. **[Command Reference](../commands/)** - Learn all available commands

## 📞 Support

If you encounter issues during installation:

- Check [Common Issues](../troubleshooting/common-issues.md)
- Run `claude-stack doctor` for diagnostics
- Visit [GitHub Issues](https://github.com/anthropics/claude-stack-cli/issues)
- Ask in [GitHub Discussions](https://github.com/anthropics/claude-stack-cli/discussions)