#!/bin/bash

# 🔍 Claude Code Security Monitor
# Continuous security monitoring and alerting system
# Version: 1.0

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
LOG_FILE="${PROJECT_ROOT}/.claude/logs/security-monitor.log"
METRICS_FILE="${PROJECT_ROOT}/.claude/metrics/security-$(date +%Y%m%d).json"
ALERT_THRESHOLD=3
DEBUG_MODE="${DEBUG_MODE:-false}"

# Colors for output
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Ensure log directory exists
mkdir -p "$(dirname "$LOG_FILE")" "$(dirname "$METRICS_FILE")"

# Logging function
log() {
    local level="$1"
    shift
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] [$level] $*" >> "$LOG_FILE" 2>/dev/null || true
    echo "[$level] $*"
}

# Alert function
alert() {
    local severity="$1"
    local message="$2"

    case "$severity" in
        "CRITICAL")
            echo "[$(date '+%Y-%m-%d %H:%M:%S')] [CRITICAL] $message" >> "$LOG_FILE" 2>/dev/null || true
            echo -e "${RED}🚨 CRITICAL: $message${NC}"
            ;;
        "WARNING")
            echo "[$(date '+%Y-%m-%d %H:%M:%S')] [WARNING] $message" >> "$LOG_FILE" 2>/dev/null || true
            echo -e "${YELLOW}⚠️ WARNING: $message${NC}"
            ;;
        "INFO")
            echo "[$(date '+%Y-%m-%d %H:%M:%S')] [INFO] $message" >> "$LOG_FILE" 2>/dev/null || true
            echo -e "${GREEN}ℹ️ INFO: $message${NC}"
            ;;
    esac
}

# Check for exposed secrets
check_secrets() {
    log "INFO" "Scanning for exposed secrets..."

    local secrets_found=0

    # Check for API key patterns in tracked files
    if git rev-parse --git-dir > /dev/null 2>&1; then
        # In git repo
        secret_patterns=(
            "sk-ant-api03-[A-Za-z0-9_-]{95}"
            "sk-[A-Za-z0-9_-]{48,}"
            "AKIAI[0-9A-Z]{16}"
            "password[[:space:]]*=[[:space:]]*['\"][^'\"]+['\"]"
            "secret[[:space:]]*=[[:space:]]*['\"][^'\"]+['\"]"
        )

        for pattern in "${secret_patterns[@]}"; do
            if git grep -E "$pattern" > /dev/null 2>&1; then
                alert "CRITICAL" "Potential secret found matching pattern: $pattern"
                ((secrets_found++))
            fi
        done
    fi

    # Check for .env in git (but not .env.example or .env-WARNING.txt)
    if git ls-files | grep -E "^\.env$" > /dev/null 2>&1; then
        alert "CRITICAL" ".env file is tracked by git - immediate action required"
        ((secrets_found++))
    fi

    # Check file permissions on sensitive files
    if [[ -f ".env" ]]; then
        local perm=$(stat -c %a .env 2>/dev/null || stat -f %A .env 2>/dev/null || echo "644")
        if [[ "$perm" != "600" ]] && [[ "$perm" != "644" ]]; then
            alert "WARNING" ".env file has suspicious permissions: $perm"
            ((secrets_found++))
        fi
    fi

    if [[ $secrets_found -eq 0 ]]; then
        alert "INFO" "Secret scan completed - no issues found"
    fi

    return $secrets_found
}

# Check dependency vulnerabilities
check_dependencies() {
    log "INFO" "Checking dependency vulnerabilities..."

    local vuln_count=0

    # Check Python dependencies if requirements.txt exists
    if [[ -f "requirements.txt" ]] && command -v pip-audit > /dev/null; then
        if ! pip-audit --format=json --output=/tmp/pip-audit.json > /dev/null 2>&1; then
            local vulns=$(jq '.vulnerabilities | length' /tmp/pip-audit.json 2>/dev/null || echo "0")
            if [[ "$vulns" -gt 0 ]]; then
                alert "WARNING" "$vulns Python package vulnerabilities detected"
                vuln_count=$((vuln_count + vulns))
            fi
        fi
    fi

    # Check Node.js dependencies if package.json exists
    if [[ -f "package.json" ]] && command -v npm > /dev/null; then
        if npm audit --audit-level moderate --json > /tmp/npm-audit.json 2>/dev/null; then
            local npm_vulns=$(jq '.metadata.vulnerabilities.total' /tmp/npm-audit.json 2>/dev/null || echo "0")
            if [[ "$npm_vulns" -gt 0 ]]; then
                alert "WARNING" "$npm_vulns Node.js package vulnerabilities detected"
                vuln_count=$((vuln_count + npm_vulns))
            fi
        fi
    fi

    if [[ $vuln_count -eq 0 ]]; then
        alert "INFO" "Dependency scan completed - no critical vulnerabilities"
    fi

    return $vuln_count
}

# Check file integrity
check_file_integrity() {
    log "INFO" "Checking critical file integrity..."

    local integrity_issues=0

    # Critical files that should exist
    critical_files=(
        ".gitignore"
        ".env.example"
        "SECURITY-SETUP.md"
    )

    for file in "${critical_files[@]}"; do
        if [[ ! -f "$file" ]]; then
            alert "WARNING" "Critical file missing: $file"
            ((integrity_issues++))
        fi
    done

    # Check .gitignore contains security patterns
    if [[ -f ".gitignore" ]]; then
        security_patterns=(".env" "*.log" "*.key")
        for pattern in "${security_patterns[@]}"; do
            if ! grep -q "$pattern" .gitignore; then
                alert "WARNING" "Security pattern '$pattern' missing from .gitignore"
                ((integrity_issues++))
            fi
        done
    fi

    # Check for suspicious file modifications
    if command -v find > /dev/null; then
        # Files modified in last hour with suspicious names
        suspicious_files=$(find . -name "*.key" -o -name "*.pem" -o -name ".env" -mtime -1 2>/dev/null | wc -l)
        if [[ "$suspicious_files" -gt 0 ]]; then
            alert "INFO" "$suspicious_files sensitive files modified recently"
        fi
    fi

    if [[ $integrity_issues -eq 0 ]]; then
        alert "INFO" "File integrity check completed - no issues found"
    fi

    return $integrity_issues
}

# Check process security
check_processes() {
    log "INFO" "Checking running processes for security issues..."

    local process_issues=0

    # Check for suspicious processes (if running on Linux/Mac)
    if command -v ps > /dev/null; then
        # Look for processes that might indicate compromise
        suspicious_procs=("netcat" "nc" "nmap" "wireshark")

        for proc in "${suspicious_procs[@]}"; do
            if pgrep "$proc" > /dev/null 2>&1; then
                alert "WARNING" "Suspicious process detected: $proc"
                ((process_issues++))
            fi
        done
    fi

    # Check for high resource usage (basic check)
    if command -v ps > /dev/null && command -v awk > /dev/null; then
        high_cpu_procs=$(ps aux | awk '$3 > 80 {print $11}' | head -3)
        if [[ -n "$high_cpu_procs" ]]; then
            alert "INFO" "High CPU usage processes detected (may indicate crypto mining)"
            if [[ $DEBUG_MODE == "true" ]]; then
                echo "$high_cpu_procs"
            fi
        fi
    fi

    return $process_issues
}

# Generate security metrics
generate_metrics() {
    local secrets_count="$1"
    local vuln_count="$2"
    local integrity_count="$3"
    local process_count="$4"

    local overall_score=100
    overall_score=$((overall_score - secrets_count * 30))
    overall_score=$((overall_score - vuln_count * 5))
    overall_score=$((overall_score - integrity_count * 10))
    overall_score=$((overall_score - process_count * 20))

    # Ensure score doesn't go negative
    if [[ $overall_score -lt 0 ]]; then
        overall_score=0
    fi

    cat > "$METRICS_FILE" << EOF
{
    "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "scan_duration_ms": $((SECONDS * 1000)),
    "security_score": $overall_score,
    "findings": {
        "secrets_exposed": $secrets_count,
        "vulnerabilities": $vuln_count,
        "integrity_issues": $integrity_count,
        "process_issues": $process_count
    },
    "thresholds": {
        "alert_threshold": $ALERT_THRESHOLD,
        "score_warning": 70,
        "score_critical": 50
    },
    "recommendations": [
        $(if [[ $secrets_count -gt 0 ]]; then echo '"Immediate: Remove exposed secrets from repository",'; fi)
        $(if [[ $vuln_count -gt 5 ]]; then echo '"High priority: Update vulnerable dependencies",'; fi)
        $(if [[ $integrity_count -gt 0 ]]; then echo '"Medium priority: Fix file integrity issues",'; fi)
        $(if [[ $overall_score -lt 70 ]]; then echo '"Review security posture and address all findings"'; fi)
    ]
}
EOF

    log "INFO" "Security metrics generated: Score $overall_score/100"

    # Alert based on score
    if [[ $overall_score -lt 50 ]]; then
        alert "CRITICAL" "Security score critical: $overall_score/100 - immediate action required"
    elif [[ $overall_score -lt 70 ]]; then
        alert "WARNING" "Security score low: $overall_score/100 - review recommended"
    else
        alert "INFO" "Security score acceptable: $overall_score/100"
    fi
}

# Main monitoring function
run_security_scan() {
    log "INFO" "Starting security monitoring scan..."
    local start_time=$SECONDS

    # Run all security checks
    check_secrets
    local secrets_count=$?
    check_dependencies
    local vuln_count=$?
    check_file_integrity
    local integrity_count=$?
    check_processes
    local process_count=$?

    # Generate metrics and alerts
    generate_metrics "$secrets_count" "$vuln_count" "$integrity_count" "$process_count"

    local total_issues=$((secrets_count + vuln_count + integrity_count + process_count))

    log "INFO" "Security scan completed in ${SECONDS}s - $total_issues total issues found"

    # Exit with error code if critical issues found
    if [[ $secrets_count -gt 0 ]] || [[ $total_issues -gt $ALERT_THRESHOLD ]]; then
        exit 1
    fi
}

# Continuous monitoring mode
continuous_monitor() {
    local interval="${1:-300}" # Default 5 minutes

    log "INFO" "Starting continuous security monitoring (interval: ${interval}s)"

    while true; do
        run_security_scan
        sleep "$interval"
    done
}

# Help function
show_help() {
    cat << EOF
🔍 Claude Code Security Monitor

USAGE:
    $0 [COMMAND] [OPTIONS]

COMMANDS:
    scan                Run one-time security scan
    monitor [INTERVAL]  Run continuous monitoring (default: 300s)
    status             Show current security status
    help               Show this help

ENVIRONMENT VARIABLES:
    DEBUG_MODE         Enable debug output (true/false)
    ALERT_THRESHOLD    Number of issues before alerting (default: 3)

EXAMPLES:
    $0 scan                    # Run security scan once
    $0 monitor 600             # Monitor every 10 minutes
    DEBUG_MODE=true $0 scan    # Run with debug output

EOF
}

# Command handling
case "${1:-scan}" in
    "scan")
        run_security_scan
        ;;
    "monitor")
        continuous_monitor "${2:-300}"
        ;;
    "status")
        if [[ -f "$METRICS_FILE" ]]; then
            jq -r '.security_score as $score | .findings as $findings | "Security Score: \($score)/100\nFindings: \($findings)"' "$METRICS_FILE"
        else
            echo "No metrics available - run 'scan' first"
        fi
        ;;
    "help"|"-h"|"--help")
        show_help
        ;;
    *)
        echo "Unknown command: $1"
        show_help
        exit 1
        ;;
esac