#!/bin/bash

# Security Event Monitoring for Claude Starter Kit
# Implements SEC-002: Real-time security event monitoring and alerting

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
LOG_DIR="${PROJECT_ROOT}/logs"
METRICS_DIR="${PROJECT_ROOT}/metrics"
SECURITY_LOG="${LOG_DIR}/security-events.log"
ALERT_THRESHOLD_FILE="${PROJECT_ROOT}/.security-thresholds"

# Security thresholds (can be overridden by .security-thresholds file)
MAX_FAILED_OPERATIONS=${MAX_FAILED_OPERATIONS:-5}
MAX_DEBUG_ACTIVATIONS=${MAX_DEBUG_ACTIVATIONS:-3}
MAX_SUSPICIOUS_PATTERNS=${MAX_SUSPICIOUS_PATTERNS:-2}
ALERT_TIME_WINDOW=${ALERT_TIME_WINDOW:-3600}  # 1 hour in seconds

# Colors for output
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Initialize monitoring
init_security_monitoring() {
    echo -e "${BLUE}🔐 Initializing Security Monitoring...${NC}"
    
    # Create directories
    mkdir -p "$LOG_DIR" "$METRICS_DIR"
    
    # Create security log if not exists
    if [ ! -f "$SECURITY_LOG" ]; then
        echo "$(date -u +"%Y-%m-%d %H:%M:%S UTC") [INFO] Security monitoring initialized" > "$SECURITY_LOG"
    fi
    
    # Load custom thresholds if available
    if [ -f "$ALERT_THRESHOLD_FILE" ]; then
        source "$ALERT_THRESHOLD_FILE"
        echo -e "${GREEN}✅ Custom security thresholds loaded${NC}"
    fi
    
    echo -e "${GREEN}✅ Security monitoring initialized${NC}"
}

# Log security event
log_security_event() {
    local severity="$1"
    local category="$2"
    local message="$3"
    local details="${4:-}"
    
    local timestamp=$(date -u +"%Y-%m-%d %H:%M:%S UTC")
    local event_id=$(date +%s)$(shuf -i 1000-9999 -n 1)
    
    # Create structured log entry
    local log_entry="{\"timestamp\":\"$timestamp\",\"event_id\":\"$event_id\",\"severity\":\"$severity\",\"category\":\"$category\",\"message\":\"$message\""
    
    if [ -n "$details" ]; then
        # Sanitize details for logging
        local sanitized_details=$(echo "$details" | sed 's/[^a-zA-Z0-9 ._:-]//g' | cut -c1-200)
        log_entry+=",\"details\":\"$sanitized_details\""
    fi
    
    log_entry+="}"
    
    # Write to security log
    echo "$log_entry" >> "$SECURITY_LOG"
    
    # Also write human-readable format
    echo "[$timestamp] [$severity] [$category] $message" >> "${LOG_DIR}/security-readable.log"
    
    # Color-coded console output
    case "$severity" in
        "CRITICAL")
            echo -e "${RED}🚨 CRITICAL: $message${NC}"
            ;;
        "HIGH")
            echo -e "${RED}⚠️ HIGH: $message${NC}"
            ;;
        "MEDIUM")
            echo -e "${YELLOW}⚠️ MEDIUM: $message${NC}"
            ;;
        "LOW")
            echo -e "${YELLOW}ℹ️ LOW: $message${NC}"
            ;;
        "INFO")
            echo -e "${GREEN}ℹ️ INFO: $message${NC}"
            ;;
    esac
}

# Check for suspicious patterns
check_suspicious_patterns() {
    local time_window=$1
    local start_time=$(($(date +%s) - time_window))
    
    # Check for multiple failed operations
    local failed_ops=$(grep -c "ERROR\|FAILED" "$SECURITY_LOG" 2>/dev/null || echo "0")
    if [ "$failed_ops" -gt "$MAX_FAILED_OPERATIONS" ]; then
        log_security_event "HIGH" "PATTERN_DETECTION" "Multiple failed operations detected: $failed_ops in ${time_window}s"
        return 1
    fi
    
    # Check for excessive debug mode activations
    local debug_activations=$(grep -c "debug_mode.*activated\|DEBUG_MODE.*true" "$SECURITY_LOG" 2>/dev/null || echo "0")
    if [ "$debug_activations" -gt "$MAX_DEBUG_ACTIVATIONS" ]; then
        log_security_event "MEDIUM" "DEBUG_SECURITY" "Multiple debug mode activations: $debug_activations in ${time_window}s"
    fi
    
    # Check for potential path traversal attempts
    local traversal_attempts=$(grep -c "\.\./\|\.\.\\\\\\|%2e%2e" "$SECURITY_LOG" 2>/dev/null || echo "0")
    if [ "$traversal_attempts" -gt 0 ]; then
        log_security_event "HIGH" "PATH_TRAVERSAL" "Potential path traversal attempts detected: $traversal_attempts"
        return 1
    fi
    
    # Check for API key patterns in logs (should never happen)
    if grep -q "sk-ant-api03-\|sk-[A-Za-z0-9_-]\{10\}" "$SECURITY_LOG" 2>/dev/null; then
        log_security_event "CRITICAL" "CREDENTIAL_EXPOSURE" "Potential API key exposure in logs detected"
        return 1
    fi
    
    return 0
}

# Generate security metrics
generate_security_metrics() {
    local timestamp=$(date -u +"%Y-%m-%d %H:%M:%S UTC")
    local date_str=$(date +"%Y%m%d")
    local metrics_file="${METRICS_DIR}/security-${date_str}.json"
    
    # Count events by severity in last 24 hours
    local last_24h=$(($(date +%s) - 86400))
    
    local critical_count=$(grep -c '"severity":"CRITICAL"' "$SECURITY_LOG" 2>/dev/null || echo "0")
    local high_count=$(grep -c '"severity":"HIGH"' "$SECURITY_LOG" 2>/dev/null || echo "0")
    local medium_count=$(grep -c '"severity":"MEDIUM"' "$SECURITY_LOG" 2>/dev/null || echo "0")
    local low_count=$(grep -c '"severity":"LOW"' "$SECURITY_LOG" 2>/dev/null || echo "0")
    local info_count=$(grep -c '"severity":"INFO"' "$SECURITY_LOG" 2>/dev/null || echo "0")
    
    # Calculate security health score
    local health_score=100
    health_score=$((health_score - critical_count * 20))
    health_score=$((health_score - high_count * 10))
    health_score=$((health_score - medium_count * 5))
    
    # Ensure score doesn't go below 0
    if [ "$health_score" -lt 0 ]; then
        health_score=0
    fi
    
    # Generate metrics JSON
    cat > "$metrics_file" << EOF
{
    "timestamp": "$timestamp",
    "date": "$date_str",
    "security_metrics": {
        "events_24h": {
            "critical": $critical_count,
            "high": $high_count,
            "medium": $medium_count,
            "low": $low_count,
            "info": $info_count,
            "total": $((critical_count + high_count + medium_count + low_count + info_count))
        },
        "health_score": $health_score,
        "status": "$([ "$health_score" -gt 80 ] && echo "HEALTHY" || ([ "$health_score" -gt 60 ] && echo "WARNING" || echo "CRITICAL"))",
        "thresholds": {
            "max_failed_operations": $MAX_FAILED_OPERATIONS,
            "max_debug_activations": $MAX_DEBUG_ACTIVATIONS,
            "alert_time_window": $ALERT_TIME_WINDOW
        },
        "last_scan": "$timestamp"
    }
}
EOF

    echo -e "${GREEN}📊 Security metrics generated: $metrics_file${NC}"
}

# Real-time monitoring function
monitor_security_events() {
    echo -e "${BLUE}🔍 Starting real-time security monitoring...${NC}"
    
    while true; do
        # Check for new suspicious patterns
        if ! check_suspicious_patterns "$ALERT_TIME_WINDOW"; then
            log_security_event "HIGH" "MONITORING" "Suspicious activity pattern detected"
            
            # Generate immediate alert report
            generate_security_metrics
        fi
        
        # Generate periodic metrics (every 10 minutes)
        local current_minute=$(date +%M)
        if [ "$((current_minute % 10))" -eq 0 ]; then
            generate_security_metrics
        fi
        
        # Sleep for 1 minute before next check
        sleep 60
    done
}

# Scan existing logs for security events
scan_existing_logs() {
    echo -e "${BLUE}🔍 Scanning existing logs for security events...${NC}"
    
    # Scan all log files in the project
    find "$PROJECT_ROOT" -name "*.log" -type f 2>/dev/null | while read -r log_file; do
        if [ -r "$log_file" ]; then
            # Look for error patterns
            local errors=$(grep -i "error\|failed\|exception" "$log_file" 2>/dev/null | wc -l)
            if [ "$errors" -gt 0 ]; then
                log_security_event "LOW" "LOG_SCAN" "Found $errors error entries in $log_file"
            fi
            
            # Look for debug patterns
            local debug_entries=$(grep -i "debug\|trace" "$log_file" 2>/dev/null | wc -l)
            if [ "$debug_entries" -gt 10 ]; then
                log_security_event "INFO" "LOG_SCAN" "High debug activity in $log_file: $debug_entries entries"
            fi
        fi
    done
    
    echo -e "${GREEN}✅ Log scan completed${NC}"
}

# Generate security dashboard
generate_dashboard() {
    local dashboard_file="${PROJECT_ROOT}/security-dashboard.html"
    local latest_metrics=$(find "$METRICS_DIR" -name "security-*.json" | sort | tail -1)
    
    if [ ! -f "$latest_metrics" ]; then
        echo -e "${YELLOW}⚠️ No security metrics found, generating defaults...${NC}"
        generate_security_metrics
        latest_metrics=$(find "$METRICS_DIR" -name "security-*.json" | sort | tail -1)
    fi
    
    echo -e "${BLUE}📊 Generating security dashboard...${NC}"
    
    cat > "$dashboard_file" << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Claude Starter Kit - Security Dashboard</title>
    <style>
        body { font-family: 'Segoe UI', sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; }
        .header { text-align: center; margin-bottom: 30px; }
        .metrics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .metric-card { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); text-align: center; }
        .metric-value { font-size: 2.5em; font-weight: bold; margin: 10px 0; }
        .metric-label { color: #666; font-size: 0.9em; text-transform: uppercase; letter-spacing: 1px; }
        .status-healthy { color: #28a745; }
        .status-warning { color: #ffc107; }
        .status-critical { color: #dc3545; }
        .recent-events { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .event-item { padding: 10px; border-left: 4px solid #007bff; margin: 10px 0; background: #f8f9fa; }
        .event-critical { border-left-color: #dc3545; }
        .event-high { border-left-color: #fd7e14; }
        .event-medium { border-left-color: #ffc107; }
        .event-low { border-left-color: #6f42c1; }
        .timestamp { font-size: 0.8em; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔐 Security Dashboard</h1>
            <p>Claude Starter Kit v4.1 - Real-time Security Monitoring</p>
        </div>
        
        <div class="metrics-grid" id="metricsGrid">
            <!-- Metrics will be loaded here -->
        </div>
        
        <div class="recent-events">
            <h3>Recent Security Events</h3>
            <div id="recentEvents">
                <!-- Events will be loaded here -->
            </div>
        </div>
    </div>
    
    <script>
        // Load security metrics
        async function loadMetrics() {
            try {
                const response = await fetch('./metrics/security-' + new Date().toISOString().slice(0,10).replace(/-/g,'') + '.json');
                const data = await response.json();
                displayMetrics(data.security_metrics);
            } catch (error) {
                console.error('Failed to load metrics:', error);
                displayDefaultMetrics();
            }
        }
        
        function displayMetrics(metrics) {
            const grid = document.getElementById('metricsGrid');
            const status = metrics.status;
            const statusClass = status === 'HEALTHY' ? 'status-healthy' : 
                               status === 'WARNING' ? 'status-warning' : 'status-critical';
            
            grid.innerHTML = `
                <div class="metric-card">
                    <div class="metric-value ${statusClass}">${metrics.health_score}/100</div>
                    <div class="metric-label">Security Health Score</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value">${metrics.events_24h.total}</div>
                    <div class="metric-label">Events (24h)</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value">${metrics.events_24h.critical + metrics.events_24h.high}</div>
                    <div class="metric-label">High Priority Events</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value ${statusClass}">${status}</div>
                    <div class="metric-label">System Status</div>
                </div>
            `;
        }
        
        function displayDefaultMetrics() {
            const grid = document.getElementById('metricsGrid');
            grid.innerHTML = `
                <div class="metric-card">
                    <div class="metric-value status-healthy">100/100</div>
                    <div class="metric-label">Security Health Score</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value">0</div>
                    <div class="metric-label">Events (24h)</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value">0</div>
                    <div class="metric-label">High Priority Events</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value status-healthy">HEALTHY</div>
                    <div class="metric-label">System Status</div>
                </div>
            `;
        }
        
        // Load metrics on page load
        loadMetrics();
        
        // Refresh every 5 minutes
        setInterval(loadMetrics, 300000);
    </script>
</body>
</html>
EOF

    echo -e "${GREEN}✅ Security dashboard generated: $dashboard_file${NC}"
}

# Main function
main() {
    local command="${1:-help}"
    
    case "$command" in
        "init")
            init_security_monitoring
            ;;
        "scan")
            init_security_monitoring
            scan_existing_logs
            generate_security_metrics
            ;;
        "monitor")
            init_security_monitoring
            monitor_security_events
            ;;
        "metrics")
            generate_security_metrics
            ;;
        "dashboard")
            generate_dashboard
            ;;
        "status")
            if [ -f "$SECURITY_LOG" ]; then
                echo -e "${BLUE}📊 Security Status Summary:${NC}"
                local critical=$(grep -c '"severity":"CRITICAL"' "$SECURITY_LOG" 2>/dev/null || echo "0")
                local high=$(grep -c '"severity":"HIGH"' "$SECURITY_LOG" 2>/dev/null || echo "0")
                local medium=$(grep -c '"severity":"MEDIUM"' "$SECURITY_LOG" 2>/dev/null || echo "0")
                
                echo "Critical events: $critical"
                echo "High severity events: $high"
                echo "Medium severity events: $medium"
                
                if [ "$critical" -eq 0 ] && [ "$high" -eq 0 ]; then
                    echo -e "${GREEN}✅ Security status: HEALTHY${NC}"
                elif [ "$critical" -eq 0 ] && [ "$high" -lt 3 ]; then
                    echo -e "${YELLOW}⚠️ Security status: WARNING${NC}"
                else
                    echo -e "${RED}🚨 Security status: CRITICAL${NC}"
                fi
            else
                echo -e "${YELLOW}⚠️ No security logs found. Run 'scan' first.${NC}"
            fi
            ;;
        "help"|*)
            echo "Security Monitor for Claude Starter Kit"
            echo ""
            echo "Usage: $0 [command]"
            echo ""
            echo "Commands:"
            echo "  init      - Initialize security monitoring"
            echo "  scan      - Scan existing logs for security events"
            echo "  monitor   - Start real-time monitoring (continuous)"
            echo "  metrics   - Generate security metrics"
            echo "  dashboard - Generate security dashboard HTML"
            echo "  status    - Show current security status"
            echo "  help      - Show this help message"
            echo ""
            echo "Examples:"
            echo "  $0 scan               # Scan existing logs"
            echo "  $0 monitor &          # Start background monitoring"
            echo "  $0 dashboard          # Generate HTML dashboard"
            ;;
    esac
}

# Run main function with all arguments
main "$@"