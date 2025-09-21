#!/bin/bash

# 🌍 Claude Code Locale Detection
# Automatic locale detection for i18n support
# Version: 1.0

# Default locale
DEFAULT_LOCALE="en"
SUPPORTED_LOCALES=("en" "fr")

# Function to validate locale
validate_locale() {
    local locale="$1"
    for supported in "${SUPPORTED_LOCALES[@]}"; do
        if [[ "$locale" == "$supported" ]]; then
            return 0
        fi
    done
    return 1
}

# Function to detect locale from environment
detect_locale() {
    local detected=""

    # 1. Check explicit CLAUDE_LOCALE setting
    if [[ -n "$CLAUDE_LOCALE" ]]; then
        detected="$CLAUDE_LOCALE"
        if validate_locale "$detected"; then
            echo "$detected"
            return 0
        fi
    fi

    # 2. Check LANG environment variable
    if [[ -n "$LANG" ]]; then
        # Extract language code (e.g., fr_FR.UTF-8 -> fr)
        detected="${LANG%%_*}"
        detected="${detected%.*}"
        if validate_locale "$detected"; then
            echo "$detected"
            return 0
        fi
    fi

    # 3. Check LANGUAGE environment variable
    if [[ -n "$LANGUAGE" ]]; then
        # Take first language from colon-separated list
        detected="${LANGUAGE%%:*}"
        detected="${detected%%_*}"
        if validate_locale "$detected"; then
            echo "$detected"
            return 0
        fi
    fi

    # 4. Check LC_ALL
    if [[ -n "$LC_ALL" ]]; then
        detected="${LC_ALL%%_*}"
        if validate_locale "$detected"; then
            echo "$detected"
            return 0
        fi
    fi

    # 5. Windows-specific detection
    if command -v powershell.exe >/dev/null 2>&1; then
        local win_locale=$(powershell.exe -Command "Get-Culture | Select-Object -ExpandProperty TwoLetterISOLanguageName" 2>/dev/null | tr -d '\r\n')
        if validate_locale "$win_locale"; then
            echo "$win_locale"
            return 0
        fi
    fi

    # 6. macOS-specific detection
    if command -v defaults >/dev/null 2>&1; then
        local mac_locale=$(defaults read -g AppleLocale 2>/dev/null | cut -d'_' -f1)
        if validate_locale "$mac_locale"; then
            echo "$mac_locale"
            return 0
        fi
    fi

    # 7. Default fallback
    echo "$DEFAULT_LOCALE"
}

# Function to get localized file path
get_localized_file() {
    local base_path="$1"
    local file_type="$2"
    local locale="${3:-$(detect_locale)}"

    echo "i18n/${locale}/${file_type}/${base_path}.md"
}

# Function to load localized content
load_localized_content() {
    local file_key="$1"
    local locale="${2:-$(detect_locale)}"

    local config_file="i18n/config.json"
    if [[ ! -f "$config_file" ]]; then
        echo "Error: i18n config not found" >&2
        return 1
    fi

    # Extract file path from config (simplified - in production use jq)
    local file_path=""
    case "$file_key" in
        "security.architecture")
            file_path="i18n/${locale}/security/architecture-defensive.md"
            ;;
        "security.monitoring")
            file_path="i18n/${locale}/security/monitoring-guide.md"
            ;;
        "security.intervention")
            file_path="i18n/${locale}/security/intervention-report.md"
            ;;
        *)
            echo "Error: Unknown file key: $file_key" >&2
            return 1
            ;;
    esac

    # Try primary locale, then fallback
    if [[ -f "$file_path" ]]; then
        echo "$file_path"
    else
        # Fallback to English
        local fallback_path="${file_path/\/${locale}\//\/en\/}"
        if [[ -f "$fallback_path" ]]; then
            echo "$fallback_path"
        else
            echo "Error: No content found for $file_key" >&2
            return 1
        fi
    fi
}

# Main function for command-line usage
main() {
    case "${1:-detect}" in
        "detect")
            detect_locale
            ;;
        "validate")
            if validate_locale "$2"; then
                echo "Valid locale: $2"
                exit 0
            else
                echo "Invalid locale: $2"
                echo "Supported: ${SUPPORTED_LOCALES[*]}"
                exit 1
            fi
            ;;
        "file")
            get_localized_file "$2" "$3" "$4"
            ;;
        "load")
            load_localized_content "$2" "$3"
            ;;
        "help"|"-h"|"--help")
            cat << EOF
🌍 Claude Code Locale Detection

USAGE:
    $0 [COMMAND] [OPTIONS]

COMMANDS:
    detect              Detect current locale
    validate LOCALE     Validate if locale is supported
    file BASE TYPE [LOCALE]  Get localized file path
    load KEY [LOCALE]   Load localized content path
    help               Show this help

EXAMPLES:
    $0 detect                           # Output: en or fr
    $0 validate fr                      # Check if 'fr' is supported
    $0 file architecture security       # Get architecture guide path
    $0 load security.monitoring fr      # Get French monitoring guide

ENVIRONMENT VARIABLES:
    CLAUDE_LOCALE      Explicit locale setting (highest priority)
    LANG              System locale (e.g., fr_FR.UTF-8)
    LANGUAGE          Language preference list
    LC_ALL            Locale setting

SUPPORTED LOCALES:
    ${SUPPORTED_LOCALES[*]}

EOF
            ;;
        *)
            echo "Unknown command: $1"
            echo "Use '$0 help' for usage information"
            exit 1
            ;;
    esac
}

# Run main function if script is executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi