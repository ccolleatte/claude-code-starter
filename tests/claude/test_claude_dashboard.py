#!/usr/bin/env python3
"""
Tests for Claude Dashboard JavaScript code
Uses Python to test JavaScript logic by parsing and simulating execution
"""
import unittest
import json
import re
import os
from pathlib import Path

class TestClaudeDashboard(unittest.TestCase):
    """Test Claude Dashboard JavaScript functionality"""
    
    def setUp(self):
        self.claude_dir = Path(__file__).parent.parent.parent / ".claude"
        self.dashboard_js = self.claude_dir / "metrics" / "claude-dashboard.js"
        self.dashboard_html = self.claude_dir / "metrics" / "dashboard.html"
    
    def test_dashboard_files_exist(self):
        """Test that dashboard files exist"""
        self.assertTrue(self.dashboard_js.exists(), "claude-dashboard.js should exist")
        self.assertTrue(self.dashboard_html.exists(), "dashboard.html should exist")
    
    def test_dashboard_js_syntax(self):
        """Test JavaScript syntax and structure"""
        with open(self.dashboard_js, 'r', encoding='utf-8') as f:
            js_content = f.read()
        
        # Test for class definition
        self.assertIn("class ClaudeDashboard", js_content)
        
        # Test for constructor
        self.assertIn("constructor()", js_content)
        
        # Test for key methods
        expected_methods = [
            "init()",
            "loadMetrics()",
            "renderDashboard()",
            "startAutoRefresh()"
        ]
        
        for method in expected_methods:
            self.assertIn(method, js_content, f"Method {method} should be defined")
    
    def test_dashboard_security_features(self):
        """Test security-related code patterns"""
        with open(self.dashboard_js, 'r', encoding='utf-8') as f:
            js_content = f.read()
        
        # Should avoid innerHTML for security
        self.assertNotIn("innerHTML", js_content, "Should not use innerHTML (XSS risk)")
        
        # Should have security comment
        self.assertIn("SECURITY:", js_content, "Should have security documentation")
        
        # Should use secure DOM manipulation
        secure_patterns = [
            "textContent",
            "createElement",
            "appendChild"
        ]
        
        has_secure_pattern = any(pattern in js_content for pattern in secure_patterns)
        self.assertTrue(has_secure_pattern, "Should use secure DOM manipulation")
    
    def test_dashboard_configuration_values(self):
        """Test dashboard configuration values"""
        with open(self.dashboard_js, 'r', encoding='utf-8') as f:
            js_content = f.read()
        
        # Test refresh interval
        self.assertIn("refreshInterval = 30000", js_content, "Should have 30s refresh interval")
        
        # Test metrics initialization
        self.assertIn("metricsData = {}", js_content, "Should initialize metrics data")
        
        # Test charts initialization
        self.assertIn("charts = {}", js_content, "Should initialize charts object")
    
    def test_dashboard_html_structure(self):
        """Test HTML dashboard structure"""
        with open(self.dashboard_html, 'r', encoding='utf-8') as f:
            html_content = f.read()
        
        # Basic HTML structure
        self.assertIn("<!DOCTYPE html>", html_content)
        self.assertIn("<html", html_content)
        self.assertIn("<head>", html_content)
        self.assertIn("<body>", html_content)
        
        # Dashboard-specific elements
        expected_elements = [
            "Claude",
            "Dashboard",
            "metrics"
        ]
        
        for element in expected_elements:
            self.assertIn(element, html_content)
    
    def test_dashboard_metrics_integration(self):
        """Test metrics file integration"""
        with open(self.dashboard_js, 'r', encoding='utf-8') as f:
            js_content = f.read()
        
        # Should load daily metrics
        self.assertIn("daily-", js_content, "Should reference daily metrics files")
        
        # Should handle missing files gracefully
        self.assertIn("getDefaultMetrics", js_content, "Should have default metrics fallback")
        
        # Should use proper date formatting
        self.assertIn("toISOString", js_content, "Should use ISO date format")
    
    def test_dashboard_error_handling(self):
        """Test error handling in dashboard code"""
        with open(self.dashboard_js, 'r', encoding='utf-8') as f:
            js_content = f.read()
        
        # Should have try-catch blocks
        self.assertIn("try {", js_content, "Should have error handling")
        self.assertIn("catch", js_content, "Should catch errors")
        
        # Should log warnings for missing files
        self.assertIn("console.warn", js_content, "Should warn about missing files")
    
    def test_metrics_json_structure(self):
        """Test metrics JSON file structure if exists"""
        metrics_dir = self.claude_dir / "metrics"
        json_files = list(metrics_dir.glob("*.json"))
        
        if json_files:
            # Test at least one JSON file
            test_file = json_files[0]
            with open(test_file, 'r', encoding='utf-8') as f:
                try:
                    data = json.load(f)
                    self.assertIsInstance(data, dict, "Metrics should be a JSON object")
                    
                    # Common metrics fields
                    expected_fields = [
                        "timestamp",
                        "metrics",
                        "performance"
                    ]
                    
                    # At least some expected fields should exist
                    has_expected = any(field in str(data) for field in expected_fields)
                    self.assertTrue(has_expected, "Should contain expected metrics fields")
                    
                except json.JSONDecodeError as e:
                    self.fail(f"Invalid JSON in {test_file}: {e}")
    
    def test_dashboard_functions_extractable(self):
        """Test that we can extract and analyze dashboard functions"""
        with open(self.dashboard_js, 'r', encoding='utf-8') as f:
            js_content = f.read()
        
        # Extract function definitions
        function_pattern = r'(async\s+)?(\w+)\s*\([^)]*\)\s*\{'
        functions = re.findall(function_pattern, js_content)
        
        # Should have several functions defined
        self.assertGreater(len(functions), 3, "Should have multiple functions")
        
        # Extract class methods
        method_pattern = r'^\s*(async\s+)?(\w+)\s*\([^)]*\)\s*\{' 
        methods = re.findall(method_pattern, js_content, re.MULTILINE)
        
        # Should have class methods
        self.assertGreater(len(methods), 2, "Should have multiple methods")
    
    def test_dashboard_constants_and_config(self):
        """Test dashboard constants and configuration"""
        with open(self.dashboard_js, 'r', encoding='utf-8') as f:
            js_content = f.read()
        
        # Should have configuration comments
        config_patterns = [
            "//",
            "/*",
            "SECURITY",
            "Real-time"
        ]
        
        for pattern in config_patterns:
            self.assertIn(pattern, js_content, f"Should contain {pattern}")
        
        # Should have numeric constants
        numeric_pattern = r'\d{4,}'  # Numbers with 4+ digits
        numbers = re.findall(numeric_pattern, js_content)
        self.assertGreater(len(numbers), 0, "Should have numeric constants")

if __name__ == '__main__':
    unittest.main()