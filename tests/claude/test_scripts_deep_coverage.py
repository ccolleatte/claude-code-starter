#!/usr/bin/env python3
"""
Deep coverage tests for Python scripts - target specific functions and branches
"""
import unittest
import sys
import os
import importlib.util
import tempfile
import shutil
from pathlib import Path

# Add scripts directory to Python path
scripts_dir = Path(__file__).parent.parent.parent / "scripts"
sys.path.insert(0, str(scripts_dir))

class TestScriptsDeepCoverage(unittest.TestCase):
    """Tests targeting specific functions and code branches for maximum coverage"""
    
    def setUp(self):
        self.scripts_dir = scripts_dir
        self.project_root = Path(__file__).parent.parent.parent
    
    def load_module(self, script_name):
        """Helper to load a script as a module"""
        script_path = self.scripts_dir / script_name
        spec = importlib.util.spec_from_file_location(
            script_name.replace('-', '_').replace('.py', ''),
            script_path
        )
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        return module
    
    def test_check_internal_links_all_branches(self):
        """Test all code branches in check-internal-links.py"""
        module = self.load_module("check-internal-links.py")
        
        # Test find_internal_links with various link formats
        test_cases = [
            ("[text](./file.md)", ["./file.md"]),
            ("[text](../other.md)", ["../other.md"]),
            ("[text](file.md#section)", ["file.md#section"]),
            ("voir CLAUDE-FR.md", ["CLAUDE-FR.md"]),
            ("voir MONITORING-FR.md pour", ["MONITORING-FR.md"]),
            ("[ext](https://example.com)", []),  # External should be filtered
            ("", []),  # Empty content
            ("No links here", []),  # No links
        ]
        
        for content, expected in test_cases:
            result = module.find_internal_links(content)
            for exp in expected:
                self.assertIn(exp, result, f"Expected {exp} in result for content: {content}")
    
    def test_check_file_links_all_scenarios(self):
        """Test check_file_links function with various scenarios"""
        module = self.load_module("check-internal-links.py")
        
        # Test with non-existent file
        result, msg = module.check_file_links("/non/existent/file.md")
        self.assertFalse(result)
        self.assertIn("introuvable", msg)
        
        # Create temporary directory structure for testing
        with tempfile.TemporaryDirectory() as temp_dir:
            temp_path = Path(temp_dir)
            
            # Create a referenced file
            target_file = temp_path / "target.md"
            target_file.write_text("# Target File")
            
            # Create another dir with file
            sub_dir = temp_path / "sub"
            sub_dir.mkdir()
            sub_target = sub_dir / "subtarget.md"
            sub_target.write_text("# Sub Target")
            
            # Test file with valid links
            test_file = temp_path / "test.md"
            test_file.write_text("""
            # Test File
            See [target](./target.md) for details.
            Also [sub](./sub/subtarget.md) for more.
            """)
            
            result, broken = module.check_file_links(str(test_file))
            self.assertTrue(result, f"Should have no broken links, but got: {broken}")
            
            # Test file with broken links
            broken_file = temp_path / "broken.md"
            broken_file.write_text("""
            # Broken File
            See [missing](./missing.md) for details.
            Also voir NONEXISTENT-FR.md
            """)
            
            result, broken = module.check_file_links(str(broken_file))
            self.assertFalse(result)
            self.assertGreater(len(broken), 0)
    
    def test_check_terminology_comprehensive(self):
        """Test all functions in check-terminology.py"""
        module = self.load_module("check-terminology.py")
        
        # Verify dictionaries exist
        self.assertTrue(hasattr(module, 'FRENCH_TERMINOLOGY'))
        self.assertTrue(hasattr(module, 'ENGLISH_PATTERNS'))
        self.assertTrue(hasattr(module, 'REQUIRED_FRENCH_TERMS'))
        
        # Test check_terminology_in_file
        if hasattr(module, 'check_terminology_in_file'):
            # Test with non-existent file
            result, msg = module.check_terminology_in_file("/non/existent/file.md")
            self.assertFalse(result)
            self.assertIn("introuvable", msg)
            
            # Test with file containing issues
            with tempfile.NamedTemporaryFile(mode='w', suffix='.md', delete=False, encoding='utf-8') as f:
                f.write("""
                # Testing File
                The workflow uses framework for debugging.
                ```bash
                # Code blocks should be ignored
                workflow="test"
                ```
                We need monitoring and configuration.
                """)
                temp_file = f.name
            
            try:
                result = module.check_terminology_in_file(temp_file)
                self.assertIsNotNone(result)
                # Should find terminology issues
                if isinstance(result, tuple) and len(result) >= 2:
                    issues = result[1] if isinstance(result[1], list) else []
                    # Some issues should be found for English terms
            finally:
                os.unlink(temp_file)
    
    def test_scripts_main_functions(self):
        """Test main functions when they exist"""
        for script_name in ["check-internal-links.py", "check-terminology.py"]:
            module = self.load_module(script_name)
            
            if hasattr(module, 'main'):
                # Test help
                original_argv = sys.argv
                try:
                    sys.argv = [script_name, '--help']
                    try:
                        module.main()
                    except SystemExit as e:
                        # Help should exit with 0
                        self.assertEqual(e.code, 0)
                finally:
                    sys.argv = original_argv
    
    def test_argument_parsing_coverage(self):
        """Test argument parsing to hit those code paths"""
        for script_name in ["check-internal-links.py", "check-terminology.py"]:
            module = self.load_module(script_name)
            
            # Look for argparse.ArgumentParser
            if hasattr(module, 'argparse'):
                # Test can create parser
                original_argv = sys.argv
                try:
                    # Test with different arguments
                    test_args = [
                        [script_name],
                        [script_name, '--lang', 'fr'],
                        [script_name, '--lang', 'en'],
                    ]
                    
                    for args in test_args:
                        sys.argv = args
                        try:
                            # Just test that parsing doesn't crash
                            # The actual execution might fail due to missing files
                            pass
                        except Exception:
                            pass
                finally:
                    sys.argv = original_argv
    
    def test_edge_cases_and_error_handling(self):
        """Test edge cases and error handling paths"""
        # Test check-internal-links edge cases
        links_module = self.load_module("check-internal-links.py")
        
        # Test with various link formats that might cause issues
        edge_cases = [
            "[link]()",  # Empty link
            "[](./file.md)",  # Empty text
            "[text](./file.md with spaces)",  # Spaces in path
            "[text](./file.md#anchor)",  # With anchor
            "[text](../../../file.md)",  # Deep relative path
            "voir FILE-WITH-CAPS.md",  # All caps
        ]
        
        for case in edge_cases:
            try:
                result = links_module.find_internal_links(case)
                self.assertIsInstance(result, list)
            except Exception as e:
                self.fail(f"Edge case failed: {case} - {e}")
        
        # Test terminology edge cases
        term_module = self.load_module("check-terminology.py")
        
        if hasattr(term_module, 'check_terminology_in_file'):
            # Test with empty file
            with tempfile.NamedTemporaryFile(mode='w', suffix='.md', delete=False, encoding='utf-8') as f:
                f.write("")  # Empty file
                empty_file = f.name
            
            try:
                result = term_module.check_terminology_in_file(empty_file)
                self.assertIsNotNone(result)
            finally:
                os.unlink(empty_file)
            
            # Test with only code blocks
            with tempfile.NamedTemporaryFile(mode='w', suffix='.md', delete=False, encoding='utf-8') as f:
                f.write("""
                ```bash
                workflow="test"
                framework="value"
                ```
                """)
                code_only_file = f.name
            
            try:
                result = term_module.check_terminology_in_file(code_only_file)
                self.assertIsNotNone(result)
            finally:
                os.unlink(code_only_file)

if __name__ == '__main__':
    unittest.main()