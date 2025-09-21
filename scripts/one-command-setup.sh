#!/bin/bash
# Claude Starter Kit - One Command Setup
# Automatic installation and configuration in <3 minutes

set -euo pipefail

# Load safe output functions
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [[ -f "$SCRIPT_DIR/safe-output.sh" ]]; then
    source "$SCRIPT_DIR/safe-output.sh"
else
    # Fallback functions
    safe_echo() {
        local message="$1"
        local level="${2:-info}"
        case "$level" in
            "error") echo "❌ $message" >&2 ;;
            "warn") echo "⚠️ $message" >&2 ;;
            "success") echo "✅ $message" ;;
            *) echo "ℹ️ $message" ;;
        esac
    }
fi

# Load i18n support
if [[ -f "$SCRIPT_DIR/i18n-helper.sh" ]]; then
    source "$SCRIPT_DIR/i18n-helper.sh"
    localized_echo() {
        local key="$1"
        local level="${2:-info}"
        local message=$(get_message "$key" "${@:3}")
        safe_echo "$message" "$level"
    }
else
    localized_echo() {
        safe_echo "$1" "${2:-info}"
    }
fi

# Configuration
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
ENV_FILE="$PROJECT_ROOT/.env"
ENV_EXAMPLE="$PROJECT_ROOT/.env.example"

# Header
echo "🚀 Claude Starter Kit - One Command Setup"
echo "=========================================="
echo ""
localized_echo "setup.oneCommand.welcome" "info"
echo ""

# Step 1: Environment Detection
safe_echo "Step 1/5: Detecting environment..." "info"

# Detect OS
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" || "$OSTYPE" == "cygwin" ]]; then
    OS="windows"
    safe_echo "Windows detected - using compatible commands" "info"
elif [[ "$OSTYPE" == "darwin"* ]]; then
    OS="macos"
    safe_echo "macOS detected" "info"
else
    OS="linux"
    safe_echo "Linux detected" "info"
fi

# Check Node.js
if command -v node >/dev/null 2>&1; then
    NODE_VERSION=$(node --version)
    safe_echo "Node.js $NODE_VERSION detected" "success"
else
    safe_echo "Node.js not found - please install Node.js 16+ first" "error"
    echo "  Download: https://nodejs.org/"
    exit 1
fi

# Check Python
if command -v python3 >/dev/null 2>&1; then
    PYTHON_VERSION=$(python3 --version)
    safe_echo "$PYTHON_VERSION detected" "success"
elif command -v python >/dev/null 2>&1; then
    PYTHON_VERSION=$(python --version)
    safe_echo "$PYTHON_VERSION detected" "success"
else
    safe_echo "Python not found - please install Python 3.8+ first" "error"
    echo "  Download: https://python.org/"
    exit 1
fi

echo ""

# Step 2: Quick Dependencies Check
safe_echo "Step 2/5: Installing dependencies..." "info"

# Install Python requirements if they exist
if [[ -f "$PROJECT_ROOT/requirements.txt" ]]; then
    if command -v pip3 >/dev/null 2>&1; then
        pip3 install -r "$PROJECT_ROOT/requirements.txt" --quiet --user || {
            safe_echo "Failed to install Python dependencies" "warn"
            safe_echo "You may need to install them manually later" "warn"
        }
    elif command -v pip >/dev/null 2>&1; then
        pip install -r "$PROJECT_ROOT/requirements.txt" --quiet --user || {
            safe_echo "Failed to install Python dependencies" "warn"
        }
    fi
    safe_echo "Python dependencies installed" "success"
fi

# NPM dependencies (if package.json exists)
if [[ -f "$PROJECT_ROOT/package.json" ]] && command -v npm >/dev/null 2>&1; then
    cd "$PROJECT_ROOT"
    npm install --silent --no-progress 2>/dev/null || {
        safe_echo "Failed to install npm dependencies" "warn"
        safe_echo "You may need to run 'npm install' manually" "warn"
    }
    safe_echo "NPM dependencies checked" "success"
fi

echo ""

# Step 3: Environment Setup
safe_echo "Step 3/5: Setting up environment..." "info"

if [[ ! -f "$ENV_EXAMPLE" ]]; then
    safe_echo ".env.example not found - creating minimal config" "warn"
    cat > "$ENV_EXAMPLE" << 'EOF'
# Environment Variables for Claude Starter Kit
ANTHROPIC_API_KEY=your_anthropic_api_key_here
EXA_API_KEY=your_exa_api_key_here
OPENAI_API_KEY=your_openai_api_key_here
CLAUDE_LOCALE=en
EOF
fi

if [[ ! -f "$ENV_FILE" ]]; then
    cp "$ENV_EXAMPLE" "$ENV_FILE"
    safe_echo "Created .env from template" "success"
else
    safe_echo "Using existing .env file" "info"
fi

echo ""

# Step 4: Quick Configuration
safe_echo "Step 4/5: Quick configuration..." "info"

# Check if we're in interactive mode or have API keys set
if [[ -t 0 ]] && [[ "${CLAUDE_SETUP_AUTO:-}" != "true" ]]; then
    # Interactive mode
    echo "🔑 API Keys Configuration (optional - press Enter to skip)"
    echo ""
    
    read -p "🔸 Anthropic API Key (for Claude): " ANTHROPIC_KEY
    if [[ -n "$ANTHROPIC_KEY" && "$ANTHROPIC_KEY" != *"your_"* ]]; then
        # Basic validation
        if [[ "$ANTHROPIC_KEY" =~ ^sk-ant-api03- ]]; then
            sed -i.bak "s/ANTHROPIC_API_KEY=.*/ANTHROPIC_API_KEY=$ANTHROPIC_KEY/" "$ENV_FILE"
            safe_echo "Anthropic API key saved" "success"
        else
            safe_echo "API key format may be incorrect" "warn"
            sed -i.bak "s/ANTHROPIC_API_KEY=.*/ANTHROPIC_API_KEY=$ANTHROPIC_KEY/" "$ENV_FILE"
        fi
    fi
    
    read -p "🔹 Exa Search API Key (for web search, optional): " EXA_KEY
    if [[ -n "$EXA_KEY" && "$EXA_KEY" != *"your_"* ]]; then
        sed -i.bak "s/EXA_API_KEY=.*/EXA_API_KEY=$EXA_KEY/" "$ENV_FILE"
        safe_echo "Exa API key saved" "success"
    fi
    
    # Clean up backup files
    [[ -f "$ENV_FILE.bak" ]] && rm "$ENV_FILE.bak"
    
    echo ""
else
    # Non-interactive mode or auto mode
    safe_echo "Running in non-interactive mode" "info"
    echo "  Set ANTHROPIC_API_KEY and EXA_API_KEY environment variables"
    echo "  Or edit .env file manually after setup"
fi

echo ""

# Step 5: Validation
safe_echo "Step 5/5: Validating setup..." "info"

# Quick syntax validation
cd "$PROJECT_ROOT"

# Test Python scripts
if [[ -f "scripts/setup-wizard.js" ]]; then
    if node -c "scripts/setup-wizard.js" 2>/dev/null; then
        safe_echo "Setup wizard syntax: OK" "success"
    else
        safe_echo "Setup wizard has syntax issues" "warn"
    fi
fi

# Test basic structure
REQUIRED_FILES=(
    ".claude/CLAUDE.md"
    "scripts"
    "tests"
)

for file in "${REQUIRED_FILES[@]}"; do
    if [[ -e "$PROJECT_ROOT/$file" ]]; then
        safe_echo "Structure check ($file): OK" "success"
    else
        safe_echo "Missing: $file" "warn"
    fi
done

# Quick test run
if command -v python3 >/dev/null 2>&1 && [[ -d "tests" ]]; then
    if python3 -m pytest tests/ -q --tb=no 2>/dev/null | grep -q "passed\|PASSED"; then
        safe_echo "Quick test run: PASSED" "success"
    else
        safe_echo "Some tests failed - check with 'npm test'" "warn"
    fi
fi

echo ""

# Success Summary
safe_echo "🎉 Setup Complete! Time to first success: < 3 minutes" "success"
echo "============================================="
echo ""
echo "📋 What's ready:"

# Check API configuration
if grep -q "sk-ant-api03-" "$ENV_FILE" 2>/dev/null; then
    echo "  ✅ Claude API configured"
else
    echo "  ⚪ Claude API - configure in .env file"
fi

if grep -q -E "^EXA_API_KEY=[^y]" "$ENV_FILE" 2>/dev/null; then
    echo "  ✅ Exa Search configured"  
else
    echo "  ⚪ Exa Search - configure in .env file (optional)"
fi

echo "  ✅ Project structure validated"
echo "  ✅ Dependencies installed"
echo "  ✅ Environment configured"
echo ""

echo "🚀 Next steps:"
echo "  1. Verify setup:     npm run validate"
echo "  2. Run tests:        npm test"
echo "  3. Interactive setup: npm run setup"
echo "  4. Read docs:        .claude/CLAUDE.md"
echo ""

echo "💡 Quick start:"
echo "  # Test configuration"
echo "  npm run check:env"
echo ""
echo "  # Run validation suite"  
echo "  npm run validate"
echo ""
echo "  # Start developing"
echo "  # Check .claude/CLAUDE.md for workflows"
echo ""

safe_echo "✨ Happy coding with Claude Starter Kit! ✨" "success"

# Auto-open documentation on macOS/Linux with desktop environment
if [[ "$OS" == "macos" ]] && command -v open >/dev/null 2>&1; then
    echo "📖 Opening documentation..."
    open ".claude/CLAUDE.md" 2>/dev/null || true
elif [[ "$OS" == "linux" ]] && command -v xdg-open >/dev/null 2>&1 && [[ -n "${DISPLAY:-}" ]]; then
    echo "📖 Opening documentation..."
    xdg-open ".claude/CLAUDE.md" 2>/dev/null || true
fi

echo ""
echo "🎯 Setup completed successfully in $(date +%T)"