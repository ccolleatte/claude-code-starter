#!/bin/bash
# Local validation script - mirrors CI/CD pipeline
# Run before committing to ensure CI will pass

set -e

echo "🎯 Claude v4.1 Local Validation"
echo "==============================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track results
FAILURES=0

print_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
    else
        echo -e "${RED}❌ $2${NC}"
        FAILURES=$((FAILURES + 1))
    fi
}

echo -e "${YELLOW}📝 Validating template syntax...${NC}"
if command -v python3 &> /dev/null; then
    python3 -m pytest tests/claude/test_templates_syntax.py -v 2>/dev/null
    print_status $? "Template syntax validation"
else
    echo -e "${YELLOW}⚠️ Python not found, skipping syntax tests${NC}"
fi

echo -e "\n${YELLOW}🔧 Testing MCP scripts...${NC}"
chmod +x .claude/scripts/*.sh 2>/dev/null || true

for script in .claude/scripts/*.sh; do
    if [ -f "$script" ]; then
        bash -n "$script" 2>/dev/null
        print_status $? "$(basename $script) syntax"
    fi
done

if command -v python3 &> /dev/null; then
    python3 -m pytest tests/claude/test_mcp_scripts.py -v 2>/dev/null
    print_status $? "MCP scripts functionality"
fi

echo -e "\n${YELLOW}🔒 Security scan...${NC}"
if command -v gitleaks &> /dev/null; then
    gitleaks detect --source . --no-banner 2>/dev/null
    if [ $? -eq 0 ]; then
        print_status 0 "No secrets detected"
    else
        print_status 1 "Secrets detected - review output above"
    fi
else
    echo -e "${YELLOW}⚠️ Gitleaks not installed, install with:${NC}"
    echo "  wget -O gitleaks.tar.gz https://github.com/gitleaks/gitleaks/releases/download/v8.18.0/gitleaks_8.18.0_linux_x64.tar.gz"
    echo "  tar -xzf gitleaks.tar.gz && sudo mv gitleaks /usr/local/bin/"
fi

# Check .gitignore
if grep -q "\.env$" .gitignore 2>/dev/null && grep -q "\.claude/settings\.local\.json" .gitignore 2>/dev/null; then
    print_status 0 "Security files properly ignored"
else
    print_status 1 "Missing entries in .gitignore"
fi

echo -e "\n${YELLOW}⚡ Performance & integration tests...${NC}"
if command -v python3 &> /dev/null; then
    python3 -m pytest tests/claude/test_integration.py -v 2>/dev/null
    print_status $? "Integration tests"
    
    # Quick performance check
    python3 -c "
import time
import os
start = time.time()
configs = []
for f in ['.claude/CLAUDE.md', '.claude/CLAUDE-WORKFLOWS.md', '.claude/CLAUDE-VALIDATION.md']:
    if os.path.exists(f):
        with open(f) as file:
            configs.append(len(file.read()))
load_time = time.time() - start
total_size = sum(configs)
if load_time < 0.1 and total_size < 100000:
    exit(0)
else:
    exit(1)
" 2>/dev/null
    print_status $? "Performance benchmarks"
fi

echo -e "\n${YELLOW}📋 Framework structure validation...${NC}"
required_files=(
    ".claude/CLAUDE.md"
    ".claude/CLAUDE-WORKFLOWS.md" 
    ".claude/CLAUDE-VALIDATION.md"
    ".claude/CLAUDE-ERRORS.md"
    ".claude/CLAUDE-SETTINGS.md"
    ".claude/scripts/cipher-mcp.sh"
    ".claude/scripts/serena-mcp.sh"
    "tests/claude/test_templates_syntax.py"
    "tests/claude/test_mcp_scripts.py"
    "tests/claude/test_integration.py"
)

structure_ok=true
for file in "${required_files[@]}"; do
    if [ ! -f "$file" ]; then
        echo -e "${RED}  Missing: $file${NC}"
        structure_ok=false
    fi
done

if $structure_ok; then
    print_status 0 "Claude v4.1 structure complete"
else
    print_status 1 "Missing required files"
fi

# Check symlink
if [ -L "CLAUDE.md" ] && [ "$(readlink CLAUDE.md)" = ".claude/CLAUDE.md" ]; then
    print_status 0 "Symlink integrity"
else
    print_status 1 "Invalid or missing CLAUDE.md symlink"
fi

echo -e "\n==============================="
if [ $FAILURES -eq 0 ]; then
    echo -e "${GREEN}🎉 All validations passed! Ready to commit.${NC}"
    exit 0
else
    echo -e "${RED}💥 $FAILURES validation(s) failed. Fix issues before committing.${NC}"
    exit 1
fi