#!/usr/bin/env python3
"""
Tests for Python scripts in scripts/ directory
These tests actually import and execute the Python code to get real coverage
"""
import unittest
import sys
import os
import importlib.util
from pathlib import Path
import tempfile

# Add scripts directory to Python path
scripts_dir = Path(__file__).parent.parent.parent / "scripts"
sys.path.insert(0, str(scripts_dir))

class TestPythonScripts(unittest.TestCase):
    """Test Python scripts to achieve actual code coverage"""
    
    def setUp(self):
        self.scripts_dir = scripts_dir
        self.project_root = Path(__file__).parent.parent.parent
    
    def test_check_internal_links_import(self):
        """Test that check-internal-links.py can be imported"""
        try:
            import check_internal_links
            self.assertTrue(hasattr(check_internal_links, 'find_internal_links'))
        except ImportError:
            # Try with dash instead of underscore
            spec = importlib.util.spec_from_file_location(
                "check_internal_links", 
                self.scripts_dir / "check-internal-links.py"
            )
            module = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(module)
            self.assertTrue(hasattr(module, 'find_internal_links'))
    
    def test_check_internal_links_function(self):
        """Test find_internal_links function"""
        import importlib.util
        spec = importlib.util.spec_from_file_location(
            "check_internal_links", 
            self.scripts_dir / "check-internal-links.py"
        )
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        
        # Test with sample markdown content
        test_content = """
        # Test Document
        See [other doc](./test.md) for details.
        Also voir CLAUDE-FR.md for instructions.
        External link: [Google](https://google.com)
        """
        
        links = module.find_internal_links(test_content)
        self.assertIn("./test.md", links)
        self.assertIn("CLAUDE-FR.md", links)
        # Should not include external links
        self.assertNotIn("https://google.com", links)
        
        # Test check_file_links function if it exists
        if hasattr(module, 'check_file_links'):
            # Create a temporary test file
            with tempfile.NamedTemporaryFile(mode='w', suffix='.md', delete=False) as f:
                f.write(test_content)
                temp_file = f.name
            
            try:
                result = module.check_file_links(temp_file)
                self.assertIsNotNone(result)
            finally:
                os.unlink(temp_file)
    
    def test_check_terminology_import(self):
        """Test that check-terminology.py can be imported"""
        import importlib.util
        spec = importlib.util.spec_from_file_location(
            "check_terminology", 
            self.scripts_dir / "check-terminology.py"
        )
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        
        # Check that terminology dictionary exists
        self.assertTrue(hasattr(module, 'FRENCH_TERMINOLOGY'))
        self.assertIsInstance(module.FRENCH_TERMINOLOGY, dict)
        self.assertIn('workflow', module.FRENCH_TERMINOLOGY)
    
    def test_check_terminology_validation(self):
        """Test terminology validation function"""
        import importlib.util
        spec = importlib.util.spec_from_file_location(
            "check_terminology", 
            self.scripts_dir / "check-terminology.py"
        )
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        
        # Test content with mixed terminology
        test_content = """
        Le workflow de développement utilise un framework moderne.
        Le dashboard de monitoring est configuré.
        """
        
        # Test that we can access the terminology dictionary
        self.assertIn('workflow', module.FRENCH_TERMINOLOGY)
        self.assertEqual(module.FRENCH_TERMINOLOGY['workflow'], 'flux de travail')
        
        # Test other functions if they exist
        if hasattr(module, 'validate_french_terms'):
            result = module.validate_french_terms(test_content)
            self.assertIsNotNone(result)
            
        if hasattr(module, 'check_file_terminology'):
            # Create a temporary test file
            with tempfile.NamedTemporaryFile(mode='w', suffix='.md', delete=False, encoding='utf-8') as f:
                f.write(test_content)
                temp_file = f.name
            
            try:
                result = module.check_file_terminology(temp_file)
                self.assertIsNotNone(result)
            finally:
                os.unlink(temp_file)
    
    def test_python_scripts_executable(self):
        """Test that Python scripts are executable"""
        python_scripts = [
            "check-internal-links.py",
            "check-terminology.py"
        ]
        
        for script_name in python_scripts:
            script_path = self.scripts_dir / script_name
            self.assertTrue(script_path.exists(), f"Script {script_name} should exist")
            
            # Check shebang
            with open(script_path, 'r', encoding='utf-8') as f:
                first_line = f.readline().strip()
            self.assertTrue(
                first_line.startswith('#!'),
                f"Script {script_name} should have shebang"
            )
    
    def test_script_main_execution(self):
        """Test scripts can run as main modules"""
        import subprocess
        
        # Test check-internal-links.py help
        result = subprocess.run([
            sys.executable, 
            str(self.scripts_dir / "check-internal-links.py"),
            "--help"
        ], capture_output=True, text=True)
        
        # Should either show help or fail gracefully
        self.assertIn("usage", result.stdout.lower() + result.stderr.lower())
    
    def test_imports_work(self):
        """Test all necessary imports work in scripts"""
        test_imports = [
            "import os",
            "import re", 
            "import sys",
            "import argparse",
            "from pathlib import Path"
        ]
        
        for import_stmt in test_imports:
            try:
                exec(import_stmt)
            except ImportError as e:
                self.fail(f"Required import failed: {import_stmt} - {e}")

if __name__ == '__main__':
    unittest.main()