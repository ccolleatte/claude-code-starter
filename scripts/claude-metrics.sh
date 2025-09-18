#!/bin/bash
# Claude Metrics Collection Script v1.1
# Cross-platform version with Unicode safety for Windows

set -e

# Load safe output functions
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/safe-output.sh"

# Configuration
METRICS_DIR="${CLAUDE_METRICS_DIR:-.claude/metrics}"
METRICS_FILE="$METRICS_DIR/claude-metrics.log"
DAILY_REPORT="$METRICS_DIR/daily-$(date +%Y%m%d).json"
ALERT_THRESHOLD_HALLUCINATIONS=${HALLUCINATION_THRESHOLD:-5}
ALERT_THRESHOLD_RESPONSE_TIME=${RESPONSE_TIME_THRESHOLD:-10.0}

# Colors for output (will be converted to ASCII on Windows)
RED='[0;31m'
GREEN='[0;32m'
YELLOW='[1;33m'
BLUE='[0;34m'
NC='[0m'

# Ensure metrics directory exists
mkdir -p "$METRICS_DIR"

log_metric() {
    local timestamp=$(date -Iseconds)
    local metric_type="$1"
    local value="$2"
    local context="$3"
    
    echo "$timestamp|$metric_type|$value|$context" >> "$METRICS_FILE"
}

# 📊 Hallucination Counter
track_hallucination() {
    local type="${1:-unknown}"
    local severity="${2:-medium}"
    local context="${3:-}"
    
    log_metric "hallucination" "$severity" "$type:$context"
    
    safe_echo "Hallucination detected:" "error"
    echo "  Type: $type"
    echo "  Severity: $severity"
    echo "  Context: $context"
    echo "  Time: $(date)"
    
    # Check daily threshold
    local today_count=$(grep "$(date +%Y-%m-%d)" "$METRICS_FILE" | grep "hallucination" | wc -l)
    if [ "$today_count" -ge "$ALERT_THRESHOLD_HALLUCINATIONS" ]; then
        safe_echo "ALERT: Daily hallucination threshold exceeded ($today_count >= $ALERT_THRESHOLD_HALLUCINATIONS)" "error"
        send_alert "hallucination_threshold" "$today_count"
    fi
}

# ⏱️ Response Time Tracker
track_response_time() {
    local operation="$1"
    local start_time="$2"
    local end_time="${3:-$(date +%s.%3N)}"
    
    local duration=$(echo "$end_time - $start_time" | bc -l 2>/dev/null || echo "0")
    
    log_metric "response_time" "$duration" "$operation"
    
    safe_echo "Response time: ${duration}s for $operation" "info"
    
    # Check threshold
    if (( $(echo "$duration > $ALERT_THRESHOLD_RESPONSE_TIME" | bc -l) )); then
        safe_echo "Slow response detected: ${duration}s > ${ALERT_THRESHOLD_RESPONSE_TIME}s" "warn"
        send_alert "slow_response" "$operation:${duration}s"
    fi
}

# 📋 Template Usage Tracker
track_template_usage() {
    local template="$1"
    local action="${2:-read}"
    local success="${3:-true}"
    
    log_metric "template_usage" "$success" "$template:$action"
    
    if [ "$success" = "true" ]; then
        safe_echo "Template used: $template ($action)" "success"
    else
        safe_echo "Template error: $template ($action)" "error"
    fi
}

# ⚙️ Configuration Error Tracker
track_config_error() {
    local error_type="$1"
    local file="$2"
    local message="$3"
    
    log_metric "config_error" "$error_type" "$file:$message"
    
    safe_echo "Config error in $file:" "error"
    echo "  Type: $error_type"
    echo "  Message: $message"
}

# 📈 Daily Report Generator
generate_daily_report() {
    local date_filter="${1:-$(date +%Y-%m-%d)}"
    
    safe_echo "Generating daily report for $date_filter..." "info"
    
    # Extract metrics for the day
    local day_metrics=$(grep "$date_filter" "$METRICS_FILE" 2>/dev/null || echo "")
    
    # Count by type
    local hallucinations=$(echo "$day_metrics" | grep "hallucination" | wc -l)
    local response_times=$(echo "$day_metrics" | grep "response_time" | cut -d'|' -f3)
    local template_uses=$(echo "$day_metrics" | grep "template_usage" | wc -l)
    local config_errors=$(echo "$day_metrics" | grep "config_error" | wc -l)
    
    # Calculate average response time
    local avg_response_time="0"
    if [ -n "$response_times" ] && [ "$response_times" != "" ]; then
        avg_response_time=$(echo "$response_times" | awk '{sum+=$1; count++} END {if(count>0) print sum/count; else print 0}')
    fi
    
    # Generate JSON report
    cat > "$DAILY_REPORT" << EOF
{
  "date": "$date_filter",
  "generated_at": "$(date -Iseconds)",
  "metrics": {
    "hallucinations": {
      "count": $hallucinations,
      "threshold": $ALERT_THRESHOLD_HALLUCINATIONS,
      "status": "$([ $hallucinations -lt $ALERT_THRESHOLD_HALLUCINATIONS ] && echo "ok" || echo "alert")"
    },
    "response_time": {
      "average": $avg_response_time,
      "threshold": $ALERT_THRESHOLD_RESPONSE_TIME,
      "samples": $(echo "$response_times" | wc -l),
      "status": "$([ $(echo "$avg_response_time < $ALERT_THRESHOLD_RESPONSE_TIME" | bc -l) -eq 1 ] && echo "ok" || echo "alert")"
    },
    "template_usage": {
      "total": $template_uses,
      "success_rate": "$(echo "$day_metrics" | grep "template_usage.*true" | wc -l)/$(echo "$day_metrics" | grep "template_usage" | wc -l)"
    },
    "config_errors": {
      "count": $config_errors,
      "status": "$([ $config_errors -eq 0 ] && echo "ok" || echo "warning")"
    }
  }
}
EOF
    
    safe_echo "Daily report saved to: $DAILY_REPORT" "success"
    cat "$DAILY_REPORT"
}

# 🚨 Alert System
send_alert() {
    local alert_type="$1"
    local details="$2"
    
    local alert_file="$METRICS_DIR/alerts.log"
    local timestamp=$(date -Iseconds)
    
    echo "$timestamp|$alert_type|$details" >> "$alert_file"
    
    # Hook for external alerting (webhook, email, etc.)
    if [ -f ".claude/hooks/alert.sh" ]; then
        bash ".claude/hooks/alert.sh" "$alert_type" "$details" "$timestamp"
    fi
}

# 📊 Real-time Dashboard Data
dashboard_data() {
    local hours="${1:-24}"
    
    safe_echo "Last $hours hours dashboard data:" "info"
    
    # Get recent metrics
    local since_time=$(date -d "$hours hours ago" -Iseconds 2>/dev/null || date -v-${hours}H -Iseconds)
    local recent_metrics=$(awk -F'|' -v since="$since_time" '$1 >= since' "$METRICS_FILE" 2>/dev/null || echo "")
    
    echo "Hallucinations: $(echo "$recent_metrics" | grep "hallucination" | wc -l)"
    echo "Config Errors: $(echo "$recent_metrics" | grep "config_error" | wc -l)"
    echo "Template Uses: $(echo "$recent_metrics" | grep "template_usage" | wc -l)"
    
    # Average response time
    local avg_rt=$(echo "$recent_metrics" | grep "response_time" | cut -d'|' -f3 | awk '{sum+=$1; count++} END {if(count>0) print sum/count; else print 0}')
    echo "Avg Response Time: ${avg_rt}s"
}

# 🔄 Maintenance
cleanup_old_metrics() {
    local keep_days="${1:-30}"
    
    safe_echo "Cleaning metrics older than $keep_days days..." "warn"
    
    # Archive old daily reports
    find "$METRICS_DIR" -name "daily-*.json" -mtime +$keep_days -exec mv {} "$METRICS_DIR/archive/" \; 2>/dev/null || true
    
    # Trim main log file
    local cutoff_date=$(date -d "$keep_days days ago" -Iseconds 2>/dev/null || date -v-${keep_days}d -Iseconds)
    awk -F'|' -v cutoff="$cutoff_date" '$1 >= cutoff' "$METRICS_FILE" > "$METRICS_FILE.tmp" && mv "$METRICS_FILE.tmp" "$METRICS_FILE"
    
    safe_echo "Cleanup completed" "success"
}

# 📖 Usage function
usage() {
    echo "Usage: $0 [COMMAND] [OPTIONS]"
    echo ""
    echo "Commands:"
    echo "  hallucination TYPE SEVERITY [CONTEXT]  - Track hallucination event"
    echo "  response-time OPERATION START [END]    - Track response time"
    echo "  template TEMPLATE [ACTION] [SUCCESS]   - Track template usage"
    echo "  config-error TYPE FILE MESSAGE         - Track config error"
    echo "  report [DATE]                         - Generate daily report"
    echo "  dashboard [HOURS]                     - Show dashboard data"
    echo "  cleanup [DAYS]                        - Clean old metrics"
    echo ""
    echo "Examples:"
    echo "  $0 hallucination function_invention high 'invented calculateScore()'"
    echo "  $0 response-time file_search 1234567890.123"
    echo "  $0 template CLAUDE-WORKFLOWS.md read true"
    echo "  $0 config-error syntax .env 'missing API key'"
    echo "  $0 report 2024-01-15"
    echo "  $0 dashboard 12"
    echo "  $0 cleanup 14"
}

# Main command handler
case "${1:-}" in
    "hallucination")
        track_hallucination "$2" "$3" "$4"
        ;;
    "response-time")
        track_response_time "$2" "$3" "$4"
        ;;
    "template")
        track_template_usage "$2" "$3" "$4"
        ;;
    "config-error")
        track_config_error "$2" "$3" "$4"
        ;;
    "report")
        generate_daily_report "$2"
        ;;
    "dashboard")
        dashboard_data "$2"
        ;;
    "cleanup")
        cleanup_old_metrics "$2"
        ;;
    "")
        dashboard_data 24
        ;;
    *)
        usage
        exit 1
        ;;
esac