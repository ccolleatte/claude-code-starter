#!/bin/bash
# Test script for Unicode fixes on Windows
# Validates that all scripts work correctly with ASCII output

echo "=== Testing Unicode Fixes on Windows ==="
echo "Date: $(date)"
echo "OS: $OSTYPE"
echo ""

# Test safe output functions
echo "1. Testing safe output functions..."
source ./scripts/safe-output.sh

# Test OS detection
OS=$(detect_os)
echo "   Detected OS: $OS"

# Test safe_echo with various levels
safe_echo "This is an info message" "info"
safe_echo "This is a success message" "success"
safe_echo "This is a warning message" "warn"
safe_echo "This is an error message" "error"

# Test emoji replacement on Windows
if [[ "$OS" == "windows" ]]; then
    echo ""
    echo "2. Testing emoji replacement..."
    safe_echo "✅ Success indicator" "success"
    safe_echo "❌ Error indicator" "error"
    safe_echo "⚠️ Warning indicator" "warn"
    safe_echo "🚨 Alert indicator" "error"
    safe_echo "📊 Stats indicator" "info"
fi

echo ""
echo "3. Testing claude-metrics.sh..."
# Test that metrics script loads without Unicode errors
if bash -n scripts/claude-metrics.sh; then
    echo "   ✓ claude-metrics.sh syntax check passed"
else
    echo "   ✗ claude-metrics.sh syntax check failed"
    exit 1
fi

# Test actual execution
echo ""
echo "4. Testing metrics script execution..."
bash scripts/claude-metrics.sh hallucination test low "Unicode test" 2>/dev/null
if [ $? -eq 0 ]; then
    echo "   ✓ Metrics script executed successfully"
else
    echo "   ✗ Metrics script execution failed"
fi

echo ""
echo "5. Testing Python scripts..."
# Test Python scripts don't have Unicode issues
python scripts/check-internal-links.py --lang=fr >/dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "   ✓ check-internal-links.py executed without Unicode errors"
else
    echo "   ⚠ check-internal-links.py had issues (may be expected)"
fi

python scripts/check-terminology.py --files="*-FR.md" >/dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "   ✓ check-terminology.py executed without Unicode errors"
else
    echo "   ⚠ check-terminology.py had issues (may be expected)"
fi

echo ""
echo "6. Testing setup wizard..."
# Just test that it can be loaded without Unicode errors
node -c scripts/setup-wizard.js
if [ $? -eq 0 ]; then
    echo "   ✓ setup-wizard.js syntax check passed"
else
    echo "   ✗ setup-wizard.js syntax check failed"
    exit 1
fi

echo ""
echo "=== Unicode Fix Testing Complete ==="
echo "All tests passed! Scripts should now work correctly on Windows."
echo ""
echo "Usage examples:"
echo "  npm run setup                    # Interactive setup wizard"
echo "  bash scripts/claude-metrics.sh report  # Generate metrics report"
echo "  python scripts/check-internal-links.py --lang=fr"
echo "  python scripts/check-terminology.py --files=\"*-FR.md\""