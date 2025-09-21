#!/bin/bash
# 🌐 I18n Integration Script - Claude Code Projects
# Integrates locale detection with existing project scripts

set -euo pipefail

# Source locale detection
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/detect-locale.sh"

# Function to get localized file path
get_localized_file() {
    local base_file="$1"
    local detected_locale
    detected_locale=$(detect_locale)
    
    # Try localized version first
    local localized_file="i18n/$detected_locale/$base_file"
    if [[ -f "$localized_file" ]]; then
        echo "$localized_file"
        return 0
    fi
    
    # Fallback to English
    local english_file="i18n/en/$base_file"
    if [[ -f "$english_file" ]]; then
        echo "$english_file"
        return 0
    fi
    
    # Fallback to French
    local french_file="i18n/fr/$base_file"
    if [[ -f "$french_file" ]]; then
        echo "$french_file"
        return 0
    fi
    
    # Fallback to original file
    if [[ -f "$base_file" ]]; then
        echo "$base_file"
        return 0
    fi
    
    echo "ERROR: No localized version found for $base_file" >&2
    return 1
}

# Function to display localized content
show_localized_content() {
    local file_path="$1"
    local localized_file
    
    if localized_file=$(get_localized_file "$file_path"); then
        echo "📄 Displaying content from: $localized_file"
        echo "🌐 Locale: $(detect_locale)"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        cat "$localized_file"
    else
        echo "❌ Could not find localized version of $file_path"
        return 1
    fi
}

# Function to update security monitoring with i18n
update_security_monitor_i18n() {
    local security_monitor_script="scripts/security-monitor.sh"
    
    if [[ ! -f "$security_monitor_script" ]]; then
        echo "❌ Security monitor script not found"
        return 1
    fi
    
    # Check if already has i18n integration
    if grep -q "i18n-integration.sh" "$security_monitor_script"; then
        echo "✅ Security monitor already has i18n integration"
        return 0
    fi
    
    echo "🔄 Adding i18n integration to security monitor..."
    
    # Add i18n sourcing to security monitor
    cat >> "$security_monitor_script" << 'EOF'

# Source i18n integration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [[ -f "$SCRIPT_DIR/i18n-integration.sh" ]]; then
    source "$SCRIPT_DIR/i18n-integration.sh"
fi

# Function to get localized security message
get_security_message() {
    local message_key="$1"
    local locale
    locale=$(detect_locale 2>/dev/null || echo "en")
    
    case "$locale" in
        "fr"|"fr_"*)
            case "$message_key" in
                "scan_started") echo "🔍 Scan de sécurité démarré..." ;;
                "scan_completed") echo "✅ Scan de sécurité terminé" ;;
                "critical_alert") echo "🚨 ALERTE CRITIQUE: Problèmes de sécurité détectés" ;;
                "warning_alert") echo "⚠️ AVERTISSEMENT: Problèmes de sécurité détectés" ;;
                "info_alert") echo "ℹ️ INFO: Aucun problème de sécurité détecté" ;;
                *) echo "$message_key" ;;
            esac
            ;;
        *)
            case "$message_key" in
                "scan_started") echo "🔍 Security scan started..." ;;
                "scan_completed") echo "✅ Security scan completed" ;;
                "critical_alert") echo "🚨 CRITICAL ALERT: Security issues detected" ;;
                "warning_alert") echo "⚠️ WARNING: Security issues detected" ;;
                "info_alert") echo "ℹ️ INFO: No security issues detected" ;;
                *) echo "$message_key" ;;
            esac
            ;;
    esac
}
EOF
    
    echo "✅ I18n integration added to security monitor"
}

# Function to list available localized files
list_localized_files() {
    echo "🌐 Available localized files:"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    local detected_locale
    detected_locale=$(detect_locale)
    echo "📍 Detected locale: $detected_locale"
    echo ""
    
    # List files in detected locale
    if [[ -d "i18n/$detected_locale" ]]; then
        echo "📂 Files in your locale ($detected_locale):"
        find "i18n/$detected_locale" -type f -name "*.md" | sort
        echo ""
    fi
    
    # List all available locales
    echo "📂 All available locales:"
    if [[ -d "i18n" ]]; then
        find i18n -type f -name "*.md" | sed 's|i18n/||' | cut -d'/' -f1 | sort -u | while read -r locale; do
            local file_count
            file_count=$(find "i18n/$locale" -type f -name "*.md" 2>/dev/null | wc -l)
            echo "  🌍 $locale ($file_count files)"
        done
    fi
}

# Function to validate i18n structure
validate_i18n_structure() {
    echo "🔍 Validating i18n structure..."
    
    local validation_passed=true
    
    # Check if i18n directory exists
    if [[ ! -d "i18n" ]]; then
        echo "❌ i18n directory not found"
        validation_passed=false
    fi
    
    # Check config file
    if [[ ! -f "i18n/config.json" ]]; then
        echo "❌ i18n/config.json not found"
        validation_passed=false
    fi
    
    # Check locale detection script
    if [[ ! -f "scripts/detect-locale.sh" ]]; then
        echo "❌ scripts/detect-locale.sh not found"
        validation_passed=false
    fi
    
    # Check that each locale has the same structure
    local reference_locale=""
    local reference_files=()
    
    # Find reference locale (prefer English, then French)
    for locale in "en" "fr"; do
        if [[ -d "i18n/$locale" ]]; then
            reference_locale="$locale"
            break
        fi
    done
    
    if [[ -n "$reference_locale" ]]; then
        echo "📍 Using $reference_locale as reference locale"
        
        # Get reference files
        mapfile -t reference_files < <(find "i18n/$reference_locale" -type f -name "*.md" | sed "s|i18n/$reference_locale/||" | sort)
        
        # Check other locales
        for locale_dir in i18n/*/; do
            local locale
            locale=$(basename "$locale_dir")
            
            if [[ "$locale" != "$reference_locale" ]]; then
                echo "🔍 Checking locale: $locale"
                
                for ref_file in "${reference_files[@]}"; do
                    if [[ ! -f "i18n/$locale/$ref_file" ]]; then
                        echo "⚠️ Missing file in $locale: $ref_file"
                        validation_passed=false
                    fi
                done
            fi
        done
    fi
    
    if [[ "$validation_passed" == "true" ]]; then
        echo "✅ I18n structure validation passed"
        return 0
    else
        echo "❌ I18n structure validation failed"
        return 1
    fi
}

# Main command handling
case "${1:-help}" in
    "show")
        if [[ $# -lt 2 ]]; then
            echo "Usage: $0 show <file-path>"
            echo "Example: $0 show security/monitoring-guide.md"
            exit 1
        fi
        show_localized_content "$2"
        ;;
    "list")
        list_localized_files
        ;;
    "validate")
        validate_i18n_structure
        ;;
    "integrate-security")
        update_security_monitor_i18n
        ;;
    "locale")
        echo "🌐 Detected locale: $(detect_locale)"
        ;;
    "help"|*)
        echo "🌐 I18n Integration Script"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo "Usage: $0 <command> [arguments]"
        echo ""
        echo "Commands:"
        echo "  show <file-path>     Show localized version of file"
        echo "  list                 List all available localized files"
        echo "  validate            Validate i18n structure"
        echo "  integrate-security  Add i18n to security monitor"
        echo "  locale              Show detected locale"
        echo "  help                Show this help"
        echo ""
        echo "Examples:"
        echo "  $0 show security/monitoring-guide.md"
        echo "  $0 list"
        echo "  $0 validate"
        ;;
esac