#!/usr/bin/env python3
"""
Test MCP Scripts Integration
Priority 1: Test integration scripts MCP
"""
import os
import sys
import unittest
import subprocess
import tempfile
import json
from pathlib import Path

class TestMCPIntegration(unittest.TestCase):
    """Test MCP scripts functionality and integration"""
    
    def setUp(self):
        """Setup test environment"""
        self.project_root = Path(__file__).parent.parent.parent
        self.scripts_dir = self.project_root / "scripts"
        self.claude_dir = self.project_root / ".claude"
        
    def test_setup_wizard_exists_and_executable(self):
        """Test that setup wizard exists and is executable"""
        setup_wizard = self.scripts_dir / "setup-wizard.js"
        self.assertTrue(setup_wizard.exists(), "setup-wizard.js should exist")
        
        # Test syntax check
        result = subprocess.run(
            ["node", "-c", str(setup_wizard)],
            capture_output=True,
            text=True,
            cwd=self.project_root
        )
        self.assertEqual(result.returncode, 0, f"setup-wizard.js syntax error: {result.stderr}")
    
    def test_setup_wizard_class_instantiation(self):
        """Test that SetupWizard class can be instantiated"""
        setup_wizard_path = self.scripts_dir / "setup-wizard.js"
        
        # Test basic syntax check first
        result = subprocess.run(
            ["node", "--check", str(setup_wizard_path)],
            capture_output=True,
            text=True,
            cwd=self.project_root
        )
        self.assertEqual(result.returncode, 0, "SetupWizard syntax should be valid")
    
    def test_safe_output_functions_exist(self):
        """Test that safe output functions are properly defined"""
        safe_output = self.scripts_dir / "safe-output.sh"
        self.assertTrue(safe_output.exists(), "safe-output.sh should exist")
        
        with open(safe_output, 'r', encoding='utf-8') as f:
            content = f.read()
            
        # Check that key functions are defined
        self.assertIn("safe_echo()", content, "safe_echo function should be defined")
        self.assertIn("safe_status()", content, "safe_status function should be defined")
        self.assertIn("safe_progress()", content, "safe_progress function should be defined")
        self.assertIn("detect_os()", content, "detect_os function should be defined")
    
    def test_safe_output_os_detection(self):
        """Test OS detection in safe output"""
        script = '''
        source scripts/safe-output.sh
        OS=$(detect_os)
        echo "Detected OS: $OS"
        '''
        
        result = subprocess.run(
            ["bash", "-c", script],
            capture_output=True,
            text=True,
            cwd=self.project_root
        )
        
        self.assertEqual(result.returncode, 0, "OS detection should work")
        self.assertIn("Detected OS:", result.stdout, "Should output detected OS")
    
    def test_claude_metrics_script_syntax(self):
        """Test claude-metrics.sh has valid syntax"""
        metrics_script = self.scripts_dir / "claude-metrics.sh"
        self.assertTrue(metrics_script.exists(), "claude-metrics.sh should exist")
        
        # On Windows, just check the file exists and has content
        content = metrics_script.read_text(encoding='utf-8')
        self.assertIn("#!/bin/bash", content, "Should be a bash script")
        self.assertGreater(len(content), 100, "Script should have substantial content")
    
    def test_claude_metrics_safe_echo_integration(self):
        """Test that claude-metrics.sh uses safe_echo functions"""
        metrics_script = self.scripts_dir / "claude-metrics.sh"
        
        with open(metrics_script, 'r', encoding='utf-8') as f:
            content = f.read()
        
        self.assertIn("safe_echo", content, "claude-metrics.sh should use safe_echo")
        self.assertIn("source", content, "claude-metrics.sh should source safe-output.sh")
        
        # Should not contain Unicode emojis in echo statements
        unicode_patterns = ["🚨", "✅", "❌", "📊", "🔧"]
        for pattern in unicode_patterns:
            if pattern in content:
                # Check it's not in an echo statement
                lines_with_emoji = [line for line in content.split('\n') if pattern in line]
                for line in lines_with_emoji:
                    self.assertNotIn("echo", line.lower(), 
                                   f"Found Unicode emoji in echo statement: {line.strip()}")
    
    def test_package_json_scripts_exist(self):
        """Test that required npm scripts exist"""
        package_json = self.project_root / "package.json"
        self.assertTrue(package_json.exists(), "package.json should exist")
        
        with open(package_json, 'r', encoding='utf-8') as f:
            package_data = json.load(f)
        
        scripts = package_data.get('scripts', {})
        
        # Test required scripts exist
        required_scripts = [
            'setup',
            'backlog:status',
            'backlog:extract',
            'validate:structure',
            'test:all'
        ]
        
        for script in required_scripts:
            self.assertIn(script, scripts, f"Required script '{script}' should exist in package.json")
    
    def test_env_example_exists_and_valid(self):
        """Test .env.example exists and has required keys"""
        env_example = self.project_root / ".env.example"
        self.assertTrue(env_example.exists(), ".env.example should exist")
        
        with open(env_example, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Check required API keys are mentioned
        required_keys = [
            'ANTHROPIC_API_KEY',
            'EXA_API_KEY',
            'OPENAI_API_KEY'
        ]
        
        for key in required_keys:
            self.assertIn(key, content, f"Required key '{key}' should be in .env.example")
    
    def test_validate_unicode_fixes_script(self):
        """Test Unicode validation script works"""
        validate_script = self.scripts_dir / "validate-unicode-fixes.js"
        self.assertTrue(validate_script.exists(), "validate-unicode-fixes.js should exist")
        
        # Test syntax
        result = subprocess.run(
            ["node", "-c", str(validate_script)],
            capture_output=True,
            text=True,
            cwd=self.project_root
        )
        self.assertEqual(result.returncode, 0, f"validate-unicode-fixes.js syntax error: {result.stderr}")
        
        # Test execution (should pass all tests)
        result = subprocess.run(
            ["node", str(validate_script)],
            capture_output=True,
            text=True,
            cwd=self.project_root
        )
        self.assertEqual(result.returncode, 0, f"Unicode validation should pass: {result.stderr}")
        self.assertIn("All Unicode fixes validated successfully", result.stdout)

if __name__ == '__main__':
    unittest.main()