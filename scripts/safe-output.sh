#!/bin/bash
# Safe Output Functions for Cross-Platform Compatibility
# Handles Unicode issues on Windows by providing ASCII fallbacks

# Detect OS
detect_os() {
    case "$OSTYPE" in
        msys|cygwin|win32) echo "windows" ;;
        darwin*) echo "macos" ;;
        linux*) echo "linux" ;;
        *) echo "unknown" ;;
    esac
}

# Safe echo function with OS-specific handling
safe_echo() {
    local message="$1"
    local level="${2:-info}"
    local os=$(detect_os)
    
    # Convert Unicode characters to ASCII equivalents on Windows
    if [[ "$os" == "windows" ]]; then
        # Replace common Unicode characters
        message=$(echo "$message" | sed \
            -e 's/✅/[OK]/g' \
            -e 's/❌/[ERROR]/g' \
            -e 's/⚠️/[WARN]/g' \
            -e 's/🚨/[ALERT]/g' \
            -e 's/🔍/[SEARCH]/g' \
            -e 's/📋/[INFO]/g' \
            -e 's/🎯/[TARGET]/g' \
            -e 's/🚀/[START]/g' \
            -e 's/🔧/[TOOL]/g' \
            -e 's/📊/[STATS]/g' \
            -e 's/🔗/[LINK]/g' \
            -e 's/💡/[TIP]/g' \
            -e 's/🔒/[SECURE]/g' \
            -e 's/⏭️/[SKIP]/g' \
            -e 's/🟢/[READY]/g' \
            -e 's/🟡/[PROGRESS]/g' \
            -e 's/🔴/[BLOCKED]/g' \
            -e 's/📁/[FOLDER]/g' \
            -e 's/📄/[FILE]/g' \
            -e 's/🎉/[SUCCESS]/g' \
            -e 's/⭐/[STAR]/g' \
            -e 's/🔥/[HOT]/g' \
            -e 's/💻/[DEV]/g' \
            -e 's/🌟/[FEATURE]/g' \
        )
    fi
    
    # Add level prefix for consistency
    case "$level" in
        error) echo "[ERROR] $message" ;;
        warn) echo "[WARN] $message" ;;
        info) echo "[INFO] $message" ;;
        success) echo "[SUCCESS] $message" ;;
        *) echo "$message" ;;
    esac
}

# Safe status display
safe_status() {
    local status="$1"
    local message="$2"
    
    case "$status" in
        ok|success) safe_echo "$message" "success" ;;
        error|fail) safe_echo "$message" "error" ;;
        warn|warning) safe_echo "$message" "warn" ;;
        *) safe_echo "$message" "info" ;;
    esac
}

# Progress indicator that works cross-platform
safe_progress() {
    local current="$1"
    local total="$2"
    local message="$3"
    
    local percent=$((current * 100 / total))
    local os=$(detect_os)
    
    if [[ "$os" == "windows" ]]; then
        echo "[PROGRESS] ($current/$total - ${percent}%) $message"
    else
        # Use Unicode progress bar on Unix systems
        local filled=$((percent / 5))
        local empty=$((20 - filled))
        local bar=$(printf '█%.0s' $(seq 1 $filled))$(printf '░%.0s' $(seq 1 $empty))
        echo "[$bar] ${percent}% $message"
    fi
}

# Export functions if sourced
if [[ "${BASH_SOURCE[0]}" != "${0}" ]]; then
    export -f safe_echo
    export -f safe_status  
    export -f safe_progress
    export -f detect_os
fi