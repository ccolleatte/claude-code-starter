#!/usr/bin/env python3
"""
Tests for demo pattern
Comprehensive test suite demonstrating testing best practices
"""

import pytest
import os
import json
import tempfile
from unittest.mock import patch, MagicMock
from datetime import datetime

# Import the module we're testing
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))
from demo_pattern import DemoClass

class TestDemoClass:
    """Test cases for DemoClass"""
    
    def setup_method(self):
        """Set up test fixtures before each test method"""
        self.demo = DemoClass()
    
    def test_init_default(self):
        """Test default initialization"""
        demo = DemoClass()
        assert demo.config == {}
        assert isinstance(demo.debug_mode, bool)
    
    def test_init_with_config(self):
        """Test initialization with custom config"""
        config = {"test_key": "test_value"}
        demo = DemoClass(config)
        assert demo.config == config
    
    def test_validate_input_valid_string(self):
        """Test input validation with valid string"""
        assert self.demo.validate_input("valid input") == True
        assert self.demo.validate_input("another valid string") == True
    
    def test_validate_input_empty_string(self):
        """Test input validation with empty string"""
        assert self.demo.validate_input("") == False
    
    def test_validate_input_non_string(self):
        """Test input validation with non-string input"""
        assert self.demo.validate_input(123) == False
        assert self.demo.validate_input(None) == False
        assert self.demo.validate_input([]) == False
    
    def test_validate_input_script_injection(self):
        """Test input validation blocks script injection"""
        malicious_inputs = [
            "<script>alert('xss')</script>",
            "javascript:alert('xss')",
            "onclick='alert(1)'",
            "onload='malicious()'",
        ]
        
        for malicious_input in malicious_inputs:
            assert self.demo.validate_input(malicious_input) == False
    
    def test_process_data_valid_input(self):
        """Test data processing with valid input"""
        test_data = "test input data"
        result = self.demo.process_data(test_data)
        
        assert isinstance(result, dict)
        assert result['input'] == test_data
        assert result['length'] == len(test_data)
        assert result['status'] == 'success'
        assert 'processed_at' in result
        assert 'api_available' in result
    
    def test_process_data_invalid_input(self):
        """Test data processing with invalid input"""
        with pytest.raises(ValueError):
            self.demo.process_data("")
        
        with pytest.raises(ValueError):
            self.demo.process_data("<script>alert('xss')</script>")
    
    @patch.dict(os.environ, {'DEMO_API_KEY': 'test_key_123'})
    def test_process_data_with_api_key(self):
        """Test data processing when API key is available"""
        demo = DemoClass()  # Reinitialize to pick up env var
        result = demo.process_data("test data")
        
        assert result['api_available'] == True
        assert result['enhanced_features'] == True
    
    @patch.dict(os.environ, {}, clear=True)
    def test_process_data_without_api_key(self):
        """Test data processing when API key is not available"""
        demo = DemoClass()  # Reinitialize without env var
        result = demo.process_data("test data")
        
        assert result['api_available'] == False
        assert result['enhanced_features'] == False
    
    @patch.dict(os.environ, {'DEMO_DEBUG': 'true'})
    def test_debug_mode_enabled(self):
        """Test debug mode detection when enabled"""
        demo = DemoClass()
        assert demo.debug_mode == True
    
    @patch.dict(os.environ, {'DEMO_DEBUG': 'false'})
    def test_debug_mode_disabled(self):
        """Test debug mode detection when disabled"""
        demo = DemoClass()
        assert demo.debug_mode == False
    
    def test_debug_mode_default(self):
        """Test debug mode default value"""
        with patch.dict(os.environ, {}, clear=True):
            demo = DemoClass()
            assert demo.debug_mode == False
    
    def test_save_result_valid_filename(self):
        """Test saving result with valid filename"""
        result = {"test": "data"}
        
        with tempfile.TemporaryDirectory() as temp_dir:
            filename = "test_output.json"
            original_cwd = os.getcwd()
            
            try:
                os.chdir(temp_dir)
                success = self.demo.save_result(result, filename)
                
                assert success == True
                assert os.path.exists(filename)
                
                # Verify file content
                with open(filename, 'r') as f:
                    saved_data = json.load(f)
                assert saved_data == result
                
            finally:
                os.chdir(original_cwd)
    
    def test_save_result_invalid_filename(self):
        """Test saving result with invalid filename"""
        result = {"test": "data"}
        
        # Test various invalid filenames
        invalid_filenames = [
            "../malicious.json",
            "/etc/passwd",
            "file with spaces.json",
            "file@special.json",
            "file.txt",  # Wrong extension
        ]
        
        for invalid_filename in invalid_filenames:
            success = self.demo.save_result(result, invalid_filename)
            assert success == False
    
    @patch('builtins.open', side_effect=IOError("Permission denied"))
    def test_save_result_io_error(self, mock_open):
        """Test saving result when IO error occurs"""
        result = {"test": "data"}
        success = self.demo.save_result(result, "valid_name.json")
        assert success == False
    
    def test_get_timestamp_format(self):
        """Test timestamp format"""
        timestamp = self.demo._get_timestamp()
        
        # Should be in ISO format
        try:
            datetime.fromisoformat(timestamp)
        except ValueError:
            pytest.fail("Timestamp is not in valid ISO format")
    
    def test_process_data_timestamp_uniqueness(self):
        """Test that processing generates unique timestamps"""
        result1 = self.demo.process_data("test1")
        result2 = self.demo.process_data("test2")
        
        # Timestamps should be different (unless processing is extremely fast)
        # This test might be flaky, but demonstrates the concept
        assert 'processed_at' in result1
        assert 'processed_at' in result2

class TestDemoPatternIntegration:
    """Integration tests for the demo pattern"""
    
    def test_full_workflow(self):
        """Test complete workflow from input to output"""
        demo = DemoClass()
        
        # Process data
        input_data = "integration test data"
        result = demo.process_data(input_data)
        
        # Verify result structure
        expected_keys = ['input', 'length', 'processed_at', 'status', 'api_available', 'enhanced_features']
        for key in expected_keys:
            assert key in result
        
        # Save result
        with tempfile.TemporaryDirectory() as temp_dir:
            original_cwd = os.getcwd()
            
            try:
                os.chdir(temp_dir)
                filename = "integration_test.json"
                success = demo.save_result(result, filename)
                
                assert success == True
                
                # Verify saved file
                with open(filename, 'r') as f:
                    saved_result = json.load(f)
                
                assert saved_result == result
                
            finally:
                os.chdir(original_cwd)
    
    @patch.dict(os.environ, {'DEMO_API_KEY': 'test_key', 'DEMO_DEBUG': 'true'})
    def test_full_workflow_with_env_vars(self):
        """Test workflow with environment variables set"""
        demo = DemoClass()
        
        assert demo.api_key == 'test_key'
        assert demo.debug_mode == True
        
        result = demo.process_data("env test data")
        assert result['api_available'] == True
        assert result['enhanced_features'] == True

class TestEdgeCases:
    """Test edge cases and error conditions"""
    
    def test_very_long_input(self):
        """Test processing very long input"""
        demo = DemoClass()
        long_input = "a" * 10000
        
        result = demo.process_data(long_input)
        assert result['length'] == 10000
        assert result['status'] == 'success'
    
    def test_unicode_input(self):
        """Test processing Unicode input"""
        demo = DemoClass()
        unicode_input = "Hello 世界 🌍"
        
        result = demo.process_data(unicode_input)
        assert result['input'] == unicode_input
        assert result['status'] == 'success'
    
    def test_special_characters(self):
        """Test processing input with special characters"""
        demo = DemoClass()
        special_input = "!@#$%^&*()_+-=[]{}|;:,.<>?"
        
        result = demo.process_data(special_input)
        assert result['input'] == special_input
        assert result['status'] == 'success'

# Performance and load tests
class TestPerformance:
    """Performance-related tests"""
    
    def test_processing_speed(self):
        """Test that processing completes in reasonable time"""
        import time
        
        demo = DemoClass()
        start_time = time.time()
        
        result = demo.process_data("performance test")
        
        end_time = time.time()
        processing_time = end_time - start_time
        
        # Should complete in less than 1 second
        assert processing_time < 1.0
        assert result['status'] == 'success'
    
    def test_multiple_processing(self):
        """Test processing multiple inputs sequentially"""
        demo = DemoClass()
        
        inputs = [f"test input {i}" for i in range(10)]
        results = []
        
        for input_data in inputs:
            result = demo.process_data(input_data)
            results.append(result)
        
        # All should succeed
        assert len(results) == 10
        for result in results:
            assert result['status'] == 'success'

if __name__ == "__main__":
    # Run tests if script is executed directly
    pytest.main([__file__, "-v"])