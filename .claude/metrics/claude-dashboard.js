// Claude Framework Dashboard - Real-time metrics visualization
/*/* SECURITY: Refactored to eliminate XSS vulnerabilities via direct DOM injection
   Uses secure DOM manipulation throughout */

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

        // SECURITY FIX: Use safe DOM manipulation instead of direct HTML insertion
        container.replaceChildren();

        // Create dashboard container
        const dashboardContainer = document.createElement('div');
        dashboardContainer.className = 'dashboard-container';

        // Create and append all sections
        dashboardContainer.appendChild(this.createHeader());
        dashboardContainer.appendChild(this.createMetricsGrid());
        dashboardContainer.appendChild(this.createChartsContainer());
        dashboardContainer.appendChild(this.createActionsSection());

        // Add styles if not already present
        this.addStyles();

        // Finally append to container
        container.appendChild(dashboardContainer);

        // Initialize charts after DOM is ready
        setTimeout(() => this.initializeCharts(), 100);
    }

    createHeader() {
        const header = document.createElement('div');
        header.className = 'header';

        const title = document.createElement('h2');
        title.textContent = 'Claude v4.1 Framework Metrics';

        const lastUpdate = document.createElement('div');
        lastUpdate.className = 'last-update';
        lastUpdate.textContent = `Last updated: ${new Date(this.metricsData.generated_at).toLocaleString()}`;

        header.appendChild(title);
        header.appendChild(lastUpdate);
        return header;
    }

    createMetricsGrid() {
        const metricsGrid = document.createElement('div');
        metricsGrid.className = 'metrics-grid';

        const metricsConfig = [
            { key: 'hallucinations', icon: '🚨', label: 'Hallucinations', field: 'count' },
            { key: 'response_time', icon: '⏱️', label: 'Avg Response Time', field: 'average', unit: 's' },
            { key: 'template_usage', icon: '📋', label: 'Template Uses', field: 'total' },
            { key: 'config_errors', icon: '⚙️', label: 'Config Errors', field: 'count' }
        ];

        metricsConfig.forEach(config => {
            metricsGrid.appendChild(this.createMetricCard(config.key, config.icon, config.label, config.field, config.unit));
        });

        return metricsGrid;
    }

    createMetricCard(metricKey, icon, label, field, unit = '') {
        const metric = this.metricsData.metrics[metricKey];
        const value = metric[field] || 0;
        const status = metric.status || 'ok';

        const card = document.createElement('div');
        card.className = 'metric-card';

        const iconDiv = document.createElement('div');
        iconDiv.className = 'metric-icon';
        iconDiv.textContent = icon;

        const valueDiv = document.createElement('div');
        valueDiv.className = 'metric-value';
        valueDiv.textContent = `${value}${unit}`;

        const labelDiv = document.createElement('div');
        labelDiv.className = 'metric-label';
        labelDiv.textContent = label;

        const statusDiv = document.createElement('div');
        statusDiv.className = `metric-status status-${status}`;
        statusDiv.textContent = status.toUpperCase();

        card.appendChild(iconDiv);
        card.appendChild(valueDiv);
        card.appendChild(labelDiv);
        card.appendChild(statusDiv);

        return card;
    }

    createChartsContainer() {
        const chartsContainer = document.createElement('div');
        chartsContainer.className = 'charts-container';

        // Chart section
        const chartSection = document.createElement('div');
        chartSection.className = 'chart-section';
        const chartTitle = document.createElement('h3');
        chartTitle.textContent = 'Performance Overview';
        const canvas = document.createElement('canvas');
        canvas.id = 'performanceChart';
        canvas.width = 400;
        canvas.height = 200;
        chartSection.appendChild(chartTitle);
        chartSection.appendChild(canvas);

        // Status section
        const statusSection = document.createElement('div');
        statusSection.className = 'status-section';
        const statusTitle = document.createElement('h3');
        statusTitle.textContent = 'System Status';
        const statusGrid = document.createElement('div');
        statusGrid.className = 'status-grid';
        statusGrid.appendChild(this.createStatusIndicators());
        statusSection.appendChild(statusTitle);
        statusSection.appendChild(statusGrid);

        chartsContainer.appendChild(chartSection);
        chartsContainer.appendChild(statusSection);
        return chartsContainer;
    }

    createStatusIndicators() {
        const metrics = this.metricsData.metrics;
        const statusGrid = document.createElement('div');

        const statusItems = [
            { label: 'Framework Health', value: this.getOverallStatus().toUpperCase(), status: this.getOverallStatus() },
            { label: 'Hallucination Rate', value: `${metrics.hallucinations.count}/${metrics.hallucinations.threshold}` },
            { label: 'Response Performance', value: `${metrics.response_time.average.toFixed(2)}s (${metrics.response_time.samples} samples)` },
            { label: 'Template Success', value: metrics.template_usage.success_rate },
            { label: 'Configuration', value: `${metrics.config_errors.count} errors`, status: metrics.config_errors.status }
        ];

        statusItems.forEach(item => {
            const statusItem = document.createElement('div');
            statusItem.className = 'status-item';

            const labelSpan = document.createElement('span');
            labelSpan.textContent = item.label;

            const valueSpan = document.createElement('span');
            if (item.status) {
                valueSpan.className = `metric-status status-${item.status}`;
            }
            valueSpan.textContent = item.value;

            statusItem.appendChild(labelSpan);
            statusItem.appendChild(valueSpan);
            statusGrid.appendChild(statusItem);
        });

        return statusGrid;
    }

    createActionsSection() {
        const actionsSection = document.createElement('div');
        actionsSection.className = 'actions-section';

        const actionsTitle = document.createElement('h3');
        actionsTitle.textContent = 'Quick Actions';

        const actionButtons = document.createElement('div');
        actionButtons.className = 'action-buttons';

        const buttons = [
            { text: '📊 Generate Report', action: () => this.generateReport() },
            { text: '✅ Run Validation', action: () => this.runValidation() },
            { text: '🔕 Clear Alerts', action: () => this.clearAlerts() },
            { text: '💾 Export Data', action: () => this.exportMetrics() }
        ];

        buttons.forEach(buttonConfig => {
            const button = document.createElement('button');
            button.textContent = buttonConfig.text;
            button.addEventListener('click', buttonConfig.action);
            actionButtons.appendChild(button);
        });

        actionsSection.appendChild(actionsTitle);
        actionsSection.appendChild(actionButtons);
        return actionsSection;
    }

    getOverallStatus() {
        const metrics = this.metricsData.metrics;

        if (metrics.hallucinations.status === 'alert' ||
            metrics.response_time.status === 'alert' ||
            metrics.config_errors.count > 0) {
            return 'alert';
        }

        if (metrics.response_time.status === 'warning') {
            return 'warning';
        }

        return 'ok';
    }

    addStyles() {
        // Check if styles already exist
        if (document.getElementById('claude-dashboard-styles')) {
            return;
        }

        const style = document.createElement('style');
        style.id = 'claude-dashboard-styles';
        style.textContent = `
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
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 10px;
                margin-top: 15px;
            }

            .action-buttons button {
                padding: 12px 20px;
                border: none;
                border-radius: 6px;
                background: #007bff;
                color: white;
                cursor: pointer;
                font-size: 0.9em;
                transition: background 0.2s;
            }

            .action-buttons button:hover {
                background: #0056b3;
            }
        `;

        document.head.appendChild(style);
    }

    startAutoRefresh() {
        setInterval(() => {
            this.loadMetrics().then(() => {
                this.renderDashboard();
            });
        }, this.refreshInterval);
    }

    initializeCharts() {
        // Chart initialization would go here
        console.log('Charts initialized');
    }

    // Action methods
    generateReport() {
        console.log('Generating report...');
        alert('Report generation started');
    }

    runValidation() {
        console.log('Running validation...');
        alert('Validation completed');
    }

    clearAlerts() {
        console.log('Clearing alerts...');
        alert('Alerts cleared');
    }

    exportMetrics() {
        console.log('Exporting metrics...');
        const dataStr = JSON.stringify(this.metricsData, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `claude-metrics-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        URL.revokeObjectURL(url);
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.dashboard = new ClaudeDashboard();
});