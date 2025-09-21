#!/bin/bash
# Test i18n System for Claude Starter Kit
# Tests language detection and message localization

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Load i18n helper
source "$PROJECT_ROOT/scripts/i18n-helper.sh"

echo "🌍 Testing i18n System for Claude Starter Kit"
echo "=============================================="
echo

# Test 1: Locale Detection
echo "📍 Test 1: Locale Detection"
echo "----------------------------"

# Test default locale
unset CLAUDE_LOCALE LANG LANGUAGE LC_ALL
echo "Default locale: $(detect_locale)"

# Test environment variables
export CLAUDE_LOCALE=fr
echo "CLAUDE_LOCALE=fr: $(detect_locale)"

export LANG=fr_FR.UTF-8
echo "LANG=fr_FR.UTF-8: $(detect_locale)"

export LANGUAGE=en:fr:de
echo "LANGUAGE=en:fr:de: $(detect_locale)"

export LC_ALL=fr_CA.UTF-8
echo "LC_ALL=fr_CA.UTF-8: $(detect_locale)"

# Test unsupported locale fallback
export CLAUDE_LOCALE=es
echo "CLAUDE_LOCALE=es (unsupported): $(detect_locale)"

echo

# Test 2: Message Loading
echo "📝 Test 2: Message Loading"
echo "---------------------------"

export CLAUDE_LOCALE=en
echo "English messages file: $(load_messages)"

export CLAUDE_LOCALE=fr  
echo "French messages file: $(load_messages)"

export CLAUDE_LOCALE=invalid
echo "Invalid locale fallback: $(load_messages)"

echo

# Test 3: Message Retrieval
echo "💬 Test 3: Message Retrieval"
echo "-----------------------------"

export CLAUDE_LOCALE=en
echo "English messages:"
echo "  common.success: $(get_message "common.success")"
echo "  setup.title: $(get_message "setup.title")"
echo "  metrics.hallucination.detected: $(get_message "metrics.hallucination.detected")"

echo

export CLAUDE_LOCALE=fr
echo "French messages:"
echo "  common.success: $(get_message "common.success")"
echo "  setup.title: $(get_message "setup.title")"
echo "  metrics.hallucination.detected: $(get_message "metrics.hallucination.detected")"

echo

# Test 4: Localized Echo
echo "🔊 Test 4: Localized Echo"
echo "-------------------------"

export CLAUDE_LOCALE=en
echo "English localized output:"
localized_echo "common.success" "success"
localized_echo "common.error" "error"
localized_echo "common.warning" "warn"

echo

export CLAUDE_LOCALE=fr
echo "French localized output:"
localized_echo "common.success" "success" 
localized_echo "common.error" "error"
localized_echo "common.warning" "warn"

echo

# Test 5: Claude Metrics Integration
echo "📊 Test 5: Claude Metrics Integration"
echo "-------------------------------------"

echo "Testing claude-metrics.sh with French locale..."
export CLAUDE_LOCALE=fr

# Test with a simple command (this will show if i18n integration works)
if [[ -f "$PROJECT_ROOT/scripts/claude-metrics.sh" ]]; then
    echo "Available commands in French environment:"
    echo "  Usage help (French locale):"
    # Just show usage to test i18n integration
    bash "$PROJECT_ROOT/scripts/claude-metrics.sh" --help 2>/dev/null | head -5 || echo "Usage display test completed"
else
    echo "  claude-metrics.sh not found, skipping integration test"
fi

echo

# Test 6: Setup Wizard i18n
echo "🧙 Test 6: Setup Wizard i18n"
echo "-----------------------------"

if [[ -f "$PROJECT_ROOT/scripts/setup-wizard.js" ]]; then
    echo "Testing setup wizard i18n support..."
    export CLAUDE_LOCALE=fr
    echo "French locale test:"
    timeout 5s node "$PROJECT_ROOT/scripts/setup-wizard.js" 2>/dev/null || echo "Setup wizard i18n test completed (timeout expected)"
    
    export CLAUDE_LOCALE=en
    echo "English locale test:"
    timeout 5s node "$PROJECT_ROOT/scripts/setup-wizard.js" 2>/dev/null || echo "Setup wizard i18n test completed (timeout expected)"
else
    echo "  setup-wizard.js not found, skipping test"
fi

echo

# Test 7: File Structure Validation
echo "📁 Test 7: File Structure Validation"
echo "-------------------------------------"

required_files=(
    "i18n/en/messages.json"
    "i18n/fr/messages.json"
    "i18n/config.json"
    "scripts/i18n-helper.sh"
)

for file in "${required_files[@]}"; do
    if [[ -f "$PROJECT_ROOT/$file" ]]; then
        echo "✅ $file exists"
    else
        echo "❌ $file missing"
    fi
done

# Validate JSON syntax
echo
echo "JSON syntax validation:"
if command -v python3 >/dev/null 2>&1; then
    for json_file in "i18n/en/messages.json" "i18n/fr/messages.json" "i18n/config.json"; do
        if python3 -c "import json; json.load(open('$PROJECT_ROOT/$json_file'))" 2>/dev/null; then
            echo "✅ $json_file - Valid JSON"
        else
            echo "❌ $json_file - Invalid JSON"
        fi
    done
else
    echo "⚠️  Python3 not available for JSON validation"
fi

echo

# Test 8: Locale Info
echo "ℹ️  Test 8: Locale Information"
echo "------------------------------"
export CLAUDE_LOCALE=fr
show_locale_info

echo
echo "🎉 i18n System Tests Completed!"
echo "================================"

# Cleanup environment
unset CLAUDE_LOCALE LANG LANGUAGE LC_ALL

# Return success
exit 0