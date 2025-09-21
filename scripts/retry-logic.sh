#!/bin/bash
# 🔄 Retry Logic and Graceful Degradation for Claude Code Scripts
# Provides robust error handling with exponential backoff and offline fallbacks

set -euo pipefail

# Configuration
MAX_RETRIES=${MAX_RETRIES:-3}
BASE_DELAY=${BASE_DELAY:-1}
MAX_DELAY=${MAX_DELAY:-60}
OFFLINE_MODE=${OFFLINE_MODE:-false}
DEBUG_MODE=${DEBUG_MODE:-false}

# Load safe output functions if available
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [[ -f "$SCRIPT_DIR/safe-output.sh" ]]; then
    source "$SCRIPT_DIR/safe-output.sh"
else
    # Fallback safe_echo function
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

# Function to calculate exponential backoff delay
calculate_delay() {
    local attempt="$1"
    local delay=$((BASE_DELAY * (2 ** (attempt - 1))))
    
    if [[ $delay -gt $MAX_DELAY ]]; then
        delay=$MAX_DELAY
    fi
    
    echo "$delay"
}

# Function to check if error is retryable
is_retryable_error() {
    local exit_code="$1"
    local error_output="$2"
    
    # Network-related errors (retryable)
    if [[ "$error_output" =~ (Connection.*refused|Connection.*timeout|Network.*unreachable|Name.*resolution.*failed|curl.*error|wget.*error) ]]; then
        return 0
    fi
    
    # HTTP errors (some retryable)
    if [[ "$error_output" =~ (502|503|504|429) ]]; then
        return 0
    fi
    
    # API rate limiting
    if [[ "$error_output" =~ (rate.*limit|too.*many.*requests) ]]; then
        return 0
    fi
    
    # Authentication errors (not retryable)
    if [[ "$error_output" =~ (401|403|Unauthorized|Forbidden|Invalid.*API.*key) ]]; then
        return 1
    fi
    
    # Client errors (not retryable)
    if [[ "$error_output" =~ (400|404|Bad.*Request|Not.*Found) ]]; then
        return 1
    fi
    
    # Unknown errors (retryable)
    return 0
}

# Main retry function with exponential backoff
retry_with_backoff() {
    local command="$1"
    local operation_name="${2:-unknown_operation}"
    local attempt=1
    local last_exit_code=0
    local last_error=""
    
    if [[ $DEBUG_MODE == 'true' ]]; then
        safe_echo "DEBUG: Starting retry operation: $operation_name" "info"
        safe_echo "DEBUG: Command: $command" "info"
        safe_echo "DEBUG: Max retries: $MAX_RETRIES" "info"
    fi
    
    while [[ $attempt -le $MAX_RETRIES ]]; do
        if [[ $DEBUG_MODE == 'true' ]]; then
            safe_echo "DEBUG: Attempt $attempt/$MAX_RETRIES for $operation_name" "info"
        fi
        
        # Execute command and capture output
        local temp_error_file
        temp_error_file=$(mktemp)
        
        if eval "$command" 2>"$temp_error_file"; then
            # Success
            rm -f "$temp_error_file"
            if [[ $attempt -gt 1 ]]; then
                safe_echo "Operation '$operation_name' succeeded on attempt $attempt" "success"
            fi
            return 0
        else
            last_exit_code=$?
            last_error=$(cat "$temp_error_file")
            rm -f "$temp_error_file"
            
            if [[ $DEBUG_MODE == 'true' ]]; then
                safe_echo "DEBUG: Attempt $attempt failed with exit code $last_exit_code" "warn"
                safe_echo "DEBUG: Error output: $last_error" "warn"
            fi
            
            # Check if error is retryable
            if ! is_retryable_error "$last_exit_code" "$last_error"; then
                safe_echo "Non-retryable error detected for '$operation_name'" "error"
                safe_echo "Error: $last_error" "error"
                return "$last_exit_code"
            fi
            
            # If this was the last attempt, don't wait
            if [[ $attempt -eq $MAX_RETRIES ]]; then
                break
            fi
            
            # Calculate delay and wait
            local delay
            delay=$(calculate_delay "$attempt")
            safe_echo "Attempt $attempt/$MAX_RETRIES failed for '$operation_name'. Retrying in ${delay}s..." "warn"
            
            if [[ $DEBUG_MODE == 'true' ]]; then
                safe_echo "DEBUG: Waiting ${delay}s before retry" "info"
            fi
            
            sleep "$delay"
            ((attempt++))
        fi
    done
    
    # All retries exhausted
    safe_echo "All $MAX_RETRIES attempts failed for '$operation_name'" "error"
    safe_echo "Last error: $last_error" "error"
    
    # Suggest troubleshooting
    suggest_troubleshooting "$operation_name" "$last_error" "$last_exit_code"
    
    return "$last_exit_code"
}

# Function to suggest troubleshooting steps
suggest_troubleshooting() {
    local operation="$1"
    local error="$2"
    local exit_code="$3"
    
    safe_echo "🔧 Troubleshooting suggestions for '$operation':" "info"
    
    # API-related issues
    if [[ "$error" =~ (API.*key|401|403|Unauthorized) ]]; then
        echo "  • Check API key configuration in .env file"
        echo "  • Verify API key is valid and has necessary permissions"
        echo "  • Ensure API key is not expired"
        echo "  • Check API service status at provider's status page"
    
    # Network issues
    elif [[ "$error" =~ (Connection|Network|timeout|DNS) ]]; then
        echo "  • Check internet connectivity"
        echo "  • Verify firewall/proxy settings"
        echo "  • Try with different DNS servers"
        echo "  • Check if service endpoint is accessible"
    
    # Rate limiting
    elif [[ "$error" =~ (rate.*limit|429|too.*many) ]]; then
        echo "  • Wait before retrying (rate limit exceeded)"
        echo "  • Consider reducing request frequency"
        echo "  • Check API usage limits and quotas"
    
    # Configuration issues
    elif [[ "$error" =~ (config|configuration|missing|not.*found) ]]; then
        echo "  • Verify configuration files exist and are readable"
        echo "  • Check file permissions"
        echo "  • Validate configuration syntax"
        echo "  • Run: npm run check:env or similar validation"
    
    # General suggestions
    else
        echo "  • Check logs for more detailed error information"
        echo "  • Verify all required dependencies are installed"
        echo "  • Try running with DEBUG_MODE=true for more details"
        echo "  • Check project documentation for known issues"
    fi
    
    # Always suggest offline mode
    echo "  • Consider running in offline mode: OFFLINE_MODE=true"
    echo "  • Enable debug mode for more information: DEBUG_MODE=true"
}

# Function to handle graceful degradation
graceful_degradation() {
    local operation="$1"
    local fallback_action="${2:-log_failure}"
    
    safe_echo "🔄 Attempting graceful degradation for '$operation'" "warn"
    
    case "$fallback_action" in
        "offline_mode")
            safe_echo "Switching to offline mode..." "info"
            export OFFLINE_MODE=true
            ;;
        "cached_data")
            safe_echo "Using cached data if available..." "info"
            # Implementation would depend on specific operation
            ;;
        "reduced_functionality")
            safe_echo "Continuing with reduced functionality..." "info"
            ;;
        "skip_operation")
            safe_echo "Skipping non-critical operation..." "warn"
            return 0
            ;;
        "log_failure")
            safe_echo "Logging failure and continuing..." "warn"
            # Log to metrics if available
            if command -v "$(dirname "$0")/claude-metrics.sh" &> /dev/null; then
                bash "$(dirname "$0")/claude-metrics.sh" config-error "retry_failure" "$operation" "All retries exhausted"
            fi
            ;;
        *)
            safe_echo "Unknown fallback action: $fallback_action" "error"
            return 1
            ;;
    esac
}

# Function to test API connectivity
test_api_connectivity() {
    local api_endpoint="$1"
    local api_key="${2:-}"
    local timeout="${3:-10}"
    
    safe_echo "Testing connectivity to $api_endpoint..." "info"
    
    local curl_cmd="curl -s --max-time $timeout"
    
    if [[ -n "$api_key" ]]; then
        curl_cmd="$curl_cmd -H 'Authorization: Bearer $api_key'"
    fi
    
    if retry_with_backoff "$curl_cmd -o /dev/null -w '%{http_code}' '$api_endpoint'" "api_connectivity_test"; then
        safe_echo "API connectivity test passed" "success"
        return 0
    else
        safe_echo "API connectivity test failed" "error"
        return 1
    fi
}

# Function to validate environment setup
validate_environment() {
    local required_vars=("$@")
    local missing_vars=()
    
    safe_echo "Validating environment setup..." "info"
    
    for var in "${required_vars[@]}"; do
        if [[ -z "${!var:-}" ]]; then
            missing_vars+=("$var")
        fi
    done
    
    if [[ ${#missing_vars[@]} -gt 0 ]]; then
        safe_echo "Missing required environment variables:" "error"
        printf '  • %s\n' "${missing_vars[@]}"
        safe_echo "Please check your .env configuration" "error"
        return 1
    fi
    
    safe_echo "Environment validation passed" "success"
    return 0
}

# Function to create error recovery report
create_error_report() {
    local operation="$1"
    local error_details="$2"
    local timestamp=$(date -Iseconds)
    local report_file=".claude/logs/error-recovery-$(date +%Y%m%d).log"
    
    mkdir -p "$(dirname "$report_file")"
    
    cat >> "$report_file" << EOF
[$timestamp] ERROR RECOVERY REPORT
Operation: $operation
Details: $error_details
Max Retries: $MAX_RETRIES
Offline Mode: $OFFLINE_MODE
Debug Mode: $DEBUG_MODE
---
EOF
    
    if [[ $DEBUG_MODE == 'true' ]]; then
        safe_echo "DEBUG: Error report saved to $report_file" "info"
    fi
}

# Example usage function
show_examples() {
    echo "🔄 Retry Logic Examples"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "Basic retry with backoff:"
    echo "  retry_with_backoff 'curl -f https://api.example.com/data' 'api_fetch'"
    echo ""
    echo "Test API connectivity:"
    echo "  test_api_connectivity 'https://api.anthropic.com/v1/messages' \"\$ANTHROPIC_API_KEY\""
    echo ""
    echo "Validate environment:"
    echo "  validate_environment ANTHROPIC_API_KEY OPENAI_API_KEY"
    echo ""
    echo "Environment variables:"
    echo "  MAX_RETRIES=5 retry_with_backoff 'your_command' 'operation_name'"
    echo "  DEBUG_MODE=true retry_with_backoff 'your_command' 'operation_name'"
    echo "  OFFLINE_MODE=true ./your-script.sh"
}

# Main command handling
case "${1:-help}" in
    "test-connectivity")
        if [[ $# -lt 2 ]]; then
            echo "Usage: $0 test-connectivity <endpoint> [api_key] [timeout]"
            exit 1
        fi
        test_api_connectivity "$2" "${3:-}" "${4:-10}"
        ;;
    "validate-env")
        shift
        validate_environment "$@"
        ;;
    "examples")
        show_examples
        ;;
    "help"|*)
        echo "🔄 Retry Logic and Error Recovery"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo "Usage: source $0  # Load functions for use in other scripts"
        echo "   or: $0 <command> [arguments]"
        echo ""
        echo "Commands:"
        echo "  test-connectivity <endpoint> [key] [timeout]  Test API connectivity"
        echo "  validate-env <var1> <var2> ...               Validate required env vars"
        echo "  examples                                     Show usage examples"
        echo "  help                                         Show this help"
        echo ""
        echo "Functions available after sourcing:"
        echo "  retry_with_backoff <command> <operation_name>"
        echo "  graceful_degradation <operation> <fallback_action>"
        echo "  test_api_connectivity <endpoint> [api_key] [timeout]"
        echo "  validate_environment <var1> <var2> ..."
        echo ""
        echo "Environment Variables:"
        echo "  MAX_RETRIES=3        Number of retry attempts"
        echo "  BASE_DELAY=1         Base delay in seconds"
        echo "  MAX_DELAY=60         Maximum delay in seconds"
        echo "  OFFLINE_MODE=false   Enable offline mode"
        echo "  DEBUG_MODE=false     Enable debug output"
        ;;
esac