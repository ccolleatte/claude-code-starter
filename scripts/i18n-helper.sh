#!/bin/bash
# i18n Helper Library for Claude Starter Kit
# Provides language detection and message localization

# Default locale
DEFAULT_LOCALE="en"
SUPPORTED_LOCALES=("en" "fr")

# Detect system locale
detect_locale() {
    local locale=""
    
    # Priority order: CLAUDE_LOCALE, LANG, LANGUAGE, LC_ALL
    if [[ -n "${CLAUDE_LOCALE:-}" ]]; then
        locale="$CLAUDE_LOCALE"
    elif [[ -n "${LANG:-}" ]]; then
        locale="${LANG%%.*}"  # Extract language part (fr_FR.UTF-8 -> fr_FR)
        locale="${locale%%_*}" # Extract language only (fr_FR -> fr)
    elif [[ -n "${LANGUAGE:-}" ]]; then
        locale="${LANGUAGE%%:*}" # First language in list
        locale="${locale%%_*}"
    elif [[ -n "${LC_ALL:-}" ]]; then
        locale="${LC_ALL%%.*}"
        locale="${locale%%_*}"
    else
        locale="$DEFAULT_LOCALE"
    fi
    
    # Validate against supported locales
    for supported in "${SUPPORTED_LOCALES[@]}"; do
        if [[ "$locale" == "$supported" ]]; then
            echo "$locale"
            return 0
        fi
    done
    
    # Fallback to default
    echo "$DEFAULT_LOCALE"
}

# Load messages for current locale
load_messages() {
    local locale="${1:-$(detect_locale)}"
    local messages_file="i18n/$locale/messages.json"
    
    if [[ ! -f "$messages_file" ]]; then
        messages_file="i18n/$DEFAULT_LOCALE/messages.json"
    fi
    
    echo "$messages_file"
}

# Get localized message
# Usage: get_message "section.key" [param1] [param2] ...
get_message() {
    local key="$1"
    shift
    local locale=$(detect_locale)
    local messages_file=$(load_messages "$locale")
    
    if [[ ! -f "$messages_file" ]]; then
        echo "[Missing i18n: $key]"
        return 1
    fi
    
    # Use Python to extract JSON message
    local message=$(python3 -c "
import json
import sys

try:
    with open('$messages_file', 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    # Navigate nested keys (e.g., 'common.success')
    keys = '$key'.split('.')
    value = data
    for k in keys:
        value = value[k]
    
    # Replace placeholders with parameters
    params = sys.argv[1:]
    for i, param in enumerate(params):
        placeholder = '{' + str(i) + '}'
        value = value.replace(placeholder, param)
        
    # Replace named placeholders
    named_placeholders = {
        '{service}': '${2:-service}',
        '{error}': '${3:-error}',
        '{count}': '${4:-count}',
        '{limit}': '${5:-limit}',
        '{duration}': '${6:-duration}',
        '{operation}': '${7:-operation}',
        '{threshold}': '${8:-threshold}',
        '{filename}': '${9:-filename}',
        '{file}': '${10:-file}',
        '{message}': '${11:-message}',
        '{type}': '${12:-type}',
        '{severity}': '${13:-severity}',
        '{context}': '${14:-context}',
        '{item}': '${15:-item}',
        '{link}': '${16:-link}',
        '{issue}': '${17:-issue}',
        '{vars}': '${18:-vars}',
        '{days}': '${19:-days}',
        '{template}': '${20:-template}',
        '{action}': '${21:-action}',
        '{url}': '${22:-url}'
    }
    
    print(value)
except (KeyError, FileNotFoundError, json.JSONDecodeError):
    print('[Missing i18n: $key]')
" "$@")
    
    echo "$message"
}

# Localized echo with color support
localized_echo() {
    local key="$1"
    local level="${2:-info}"
    shift 2
    
    local message=$(get_message "$key" "$@")
    
    # Load safe output if available
    if [[ -f "$(dirname "${BASH_SOURCE[0]}")/safe-output.sh" ]]; then
        source "$(dirname "${BASH_SOURCE[0]}")/safe-output.sh"
        safe_echo "$message" "$level"
    else
        case "$level" in
            "error") echo "ERROR: $message" >&2 ;;
            "warn") echo "WARNING: $message" >&2 ;;
            "success") echo "SUCCESS: $message" ;;
            *) echo "$message" ;;
        esac
    fi
}

# Get current locale info
show_locale_info() {
    local current_locale=$(detect_locale)
    local messages_file=$(load_messages "$current_locale")
    
    echo "Current locale: $current_locale"
    echo "Messages file: $messages_file"
    echo "Supported locales: ${SUPPORTED_LOCALES[*]}"
    echo "Environment variables:"
    echo "  CLAUDE_LOCALE=${CLAUDE_LOCALE:-unset}"
    echo "  LANG=${LANG:-unset}"
    echo "  LANGUAGE=${LANGUAGE:-unset}"
    echo "  LC_ALL=${LC_ALL:-unset}"
}

# Test function
test_i18n() {
    echo "=== i18n System Test ==="
    show_locale_info
    echo
    echo "Testing messages:"
    localized_echo "common.success"
    localized_echo "common.error" "error"
    localized_echo "setup.title"
    localized_echo "metrics.hallucination.detected"
    echo
    echo "Testing with French locale:"
    CLAUDE_LOCALE=fr localized_echo "common.success"
    CLAUDE_LOCALE=fr localized_echo "setup.welcome"
}

# Export functions for use in other scripts
export -f detect_locale
export -f load_messages  
export -f get_message
export -f localized_echo
export -f show_locale_info