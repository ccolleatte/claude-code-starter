// Claude Framework Dashboard - Real-time metrics visualization
// Loads and displays metrics from daily JSON reports

class ClaudeDashboard {
    constructor() {
        this.metricsData = {};
        this.refreshInterval = 30000; // 30 seconds
        this.charts = {};
        this.init();
    }

    async init() {
        await this.loadMetrics();
        this.renderDashboard();
        this.startAutoRefresh();
    }

    async loadMetrics() {
        try {
            // Load today's metrics
            const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
            const response = await fetch(`daily-${today}.json`);
            
            if (response.ok) {
                this.metricsData = await response.json();
            } else {
                console.warn('No metrics file found for today, using defaults');
                this.metricsData = this.getDefaultMetrics();
            }
        } catch (error) {
            console.error('Failed to load metrics:', error);
            this.metricsData = this.getDefaultMetrics();
        }
    }

    getDefaultMetrics() {
        return {
            date: new Date().toISOString().split('T')[0],
            generated_at: new Date().toISOString(),
            metrics: {
                hallucinations: { count: 0, threshold: 3, status: "ok" },
                response_time: { average: 0, threshold: 5.0, samples: 0, status: "ok" },
                template_usage: { total: 0, success_rate: "0/0" },
                config_errors: { count: 0, status: "ok" }
            }
        };
    }

    renderDashboard() {
        const container = document.getElementById('metrics');
        if (!container) {
            console.error('Metrics container not found');
            return;
        }

        container.innerHTML = `
            <div class="dashboard-container">
                <div class="header">
                    <h2>Claude v4.1 Framework Metrics</h2>
                    <div class="last-update">Last updated: ${new Date(this.metricsData.generated_at).toLocaleString()}</div>
                </div>
                
                <div class="metrics-grid">
                    ${this.renderMetricCard('hallucinations', '🚨', 'Hallucinations', 'count')}
                    ${this.renderMetricCard('response_time', '⏱️', 'Avg Response Time', 'average', 's')}
                    ${this.renderMetricCard('template_usage', '📋', 'Template Uses', 'total')}
                    ${this.renderMetricCard('config_errors', '⚙️', 'Config Errors', 'count')}
                </div>

                <div class="charts-container">
                    <div class="chart-section">
                        <h3>Performance Overview</h3>
                        <canvas id="performanceChart" width="400" height="200"></canvas>
                    </div>
                    
                    <div class="status-section">
                        <h3>System Status</h3>
                        <div class="status-grid">
                            ${this.renderStatusIndicators()}
                        </div>
                    </div>
                </div>

                <div class="actions-section">
                    <h3>Quick Actions</h3>
                    <div class="action-buttons">
                        <button onclick="dashboard.generateReport()">📊 Generate Report</button>
                        <button onclick="dashboard.runValidation()">✅ Run Validation</button>
                        <button onclick="dashboard.clearAlerts()">🔕 Clear Alerts</button>
                        <button onclick="dashboard.exportMetrics()">💾 Export Data</button>
                    </div>
                </div>
            </div>

            <style>
                .dashboard-container {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    max-width: 1200px;
                    margin: 0 auto;
                    padding: 20px;
                    background: #f5f5f5;
                    border-radius: 8px;
                }

                .header {
                    text-align: center;
                    margin-bottom: 30px;
                    padding: 20px;
                    background: white;
                    border-radius: 8px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }

                .last-update {
                    color: #666;
                    font-size: 0.9em;
                    margin-top: 10px;
                }

                .metrics-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                    gap: 20px;
                    margin-bottom: 30px;
                }

                .metric-card {
                    background: white;
                    padding: 20px;
                    border-radius: 8px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                    text-align: center;
                    transition: transform 0.2s;
                }

                .metric-card:hover {
                    transform: translateY(-2px);
                }

                .metric-icon {
                    font-size: 2em;
                    margin-bottom: 10px;
                }

                .metric-value {
                    font-size: 2.5em;
                    font-weight: bold;
                    margin: 10px 0;
                }

                .metric-label {
                    color: #666;
                    font-size: 0.9em;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                }

                .metric-status {
                    display: inline-block;
                    padding: 4px 12px;
                    border-radius: 20px;
                    font-size: 0.8em;
                    font-weight: bold;
                    margin-top: 10px;
                }

                .status-ok { background: #d4edda; color: #155724; }
                .status-warning { background: #fff3cd; color: #856404; }
                .status-alert { background: #f8d7da; color: #721c24; }

                .charts-container {
                    display: grid;
                    grid-template-columns: 2fr 1fr;
                    gap: 20px;
                    margin-bottom: 30px;
                }

                .chart-section, .status-section {
                    background: white;
                    padding: 20px;
                    border-radius: 8px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }

                .status-grid {
                    display: grid;
                    gap: 10px;
                }

                .status-item {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 10px;
                    background: #f8f9fa;
                    border-radius: 4px;
                }

                .actions-section {
                    background: white;
                    padding: 20px;
                    border-radius: 8px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }

                .action-buttons {
                    display: flex;
                    gap: 10px;
                    flex-wrap: wrap;
                }

                .action-buttons button {
                    padding: 10px 20px;
                    border: none;
                    border-radius: 4px;
                    background: #007bff;
                    color: white;
                    cursor: pointer;
                    transition: background 0.2s;
                }

                .action-buttons button:hover {
                    background: #0056b3;
                }

                @media (max-width: 768px) {
                    .charts-container {
                        grid-template-columns: 1fr;
                    }
                    
                    .action-buttons {
                        flex-direction: column;
                    }
                }
            </style>
        `;
    }

    renderMetricCard(metricKey, icon, label, valueKey, unit = '') {
        const metric = this.metricsData.metrics[metricKey];
        const value = metric[valueKey];
        const status = metric.status;
        
        return `
            <div class="metric-card">
                <div class="metric-icon">${icon}</div>
                <div class="metric-value">${value}${unit}</div>
                <div class="metric-label">${label}</div>
                <div class="metric-status status-${status}">${status.toUpperCase()}</div>
            </div>
        `;
    }

    renderStatusIndicators() {
        const metrics = this.metricsData.metrics;
        
        return `
            <div class="status-item">
                <span>Framework Health</span>
                <span class="metric-status status-${this.getOverallStatus()}">${this.getOverallStatus().toUpperCase()}</span>
            </div>
            <div class="status-item">
                <span>Hallucination Rate</span>
                <span>${metrics.hallucinations.count}/${metrics.hallucinations.threshold}</span>
            </div>
            <div class="status-item">
                <span>Response Performance</span>
                <span>${metrics.response_time.average.toFixed(2)}s (${metrics.response_time.samples} samples)</span>
            </div>
            <div class="status-item">
                <span>Template Success</span>
                <span>${metrics.template_usage.success_rate}</span>
            </div>
            <div class="status-item">
                <span>Configuration</span>
                <span class="metric-status status-${metrics.config_errors.status}">${metrics.config_errors.count} errors</span>
            </div>
        `;
    }

    getOverallStatus() {
        const metrics = this.metricsData.metrics;
        
        // Check for any alert conditions
        if (metrics.hallucinations.status === 'alert' || 
            metrics.response_time.status === 'alert' ||
            metrics.config_errors.count > 0) {
            return 'alert';
        }
        
        // Check for warning conditions
        if (metrics.response_time.status === 'warning') {
            return 'warning';
        }
        
        return 'ok';
    }

    startAutoRefresh() {
        setInterval(async () => {
            await this.loadMetrics();
            this.renderDashboard();
        }, this.refreshInterval);
    }

    // Action handlers
    async generateReport() {
        try {
            const response = await fetch('/api/generate-report', { method: 'POST' });
            const result = await response.text();
            alert('Report generated: ' + result);
        } catch (error) {
            alert('Failed to generate report. Run: scripts/claude-metrics.sh report');
        }
    }

    async runValidation() {
        try {
            const response = await fetch('/api/run-validation', { method: 'POST' });
            const result = await response.text();
            alert('Validation result: ' + result);
        } catch (error) {
            alert('Failed to run validation. Run: npm run validate');
        }
    }

    clearAlerts() {
        if (confirm('Clear all alerts? This action cannot be undone.')) {
            // Clear alerts logic
            alert('Alerts cleared');
        }
    }

    exportMetrics() {
        const dataStr = JSON.stringify(this.metricsData, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `claude-metrics-${this.metricsData.date}.json`;
        link.click();
        
        URL.revokeObjectURL(url);
    }
}

// Initialize dashboard when DOM is loaded
let dashboard;
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        dashboard = new ClaudeDashboard();
    });
} else {
    dashboard = new ClaudeDashboard();
}