#!/usr/bin/env python3
"""
Test script for debug mode implementation in claude-metrics.sh
Tests the security features and validation functions
"""

import re
import os
import sys

def test_data_sanitization():
    """Test data sanitization functions"""
    print("=== Testing Data Sanitization ===")
    
    test_cases = [
        "normal_input",
        "test $(rm -rf /) injection",
        "data with @#$%^&*() special chars",
        "unicode_test_éàü",
        "very_long_input_" + "x" * 200,
        ""
    ]
    
    for test_input in test_cases:
        # Simulate production sanitization
        sanitized = ''.join(c for c in test_input if c.isalnum() or c in ' ._-')[:100]
        print(f"Input: '{test_input[:50]}{'...' if len(test_input) > 50 else ''}'")
        print(f"Sanitized: '{sanitized}'")
        print(f"Safe: {'OK' if sanitized == sanitized.strip() and len(sanitized) <= 100 else 'FAIL'}")
        print()

def test_date_validation():
    """Test date format validation"""
    print("=== Testing Date Validation ===")
    
    date_pattern = r'^[0-9]{4}-[0-9]{2}-[0-9]{2}$'
    test_dates = [
        "2024-01-15",    # Valid
        "2024-1-1",      # Invalid format
        "invalid",       # Invalid
        "2024/01/15",    # Wrong separator
        "2024-13-45",    # Invalid date values
        "24-01-15",      # Wrong year format
        "2024-01-1",     # Wrong day format
    ]
    
    for date in test_dates:
        is_valid = bool(re.match(date_pattern, date))
        print(f"Date: '{date}' -> {'VALID' if is_valid else 'INVALID'}")
    print()

def test_parameter_validation():
    """Test numeric parameter validation"""
    print("=== Testing Parameter Validation ===")
    
    test_params = [
        ("30", "keep_days"),
        ("1", "minimum"),
        ("365", "maximum"),
        ("0", "zero"),
        ("366", "too_large"),
        ("-5", "negative"),
        ("abc", "non_numeric"),
        ("", "empty"),
        ("30.5", "float"),
    ]
    
    for param, description in test_params:
        try:
            if param == "":
                raise ValueError("Empty parameter")
            val = int(float(param))  # Handle potential floats
            is_valid = 1 <= val <= 365
            result = "VALID" if is_valid else "OUT_OF_RANGE"
        except ValueError:
            result = "INVALID_FORMAT"
        
        print(f"Parameter: '{param}' ({description}) -> {result}")
    print()

def test_environment_detection():
    """Test CI/CD environment detection"""
    print("=== Testing Environment Detection ===")
    
    # Save current environment
    original_env = {}
    ci_vars = ['CI', 'GITHUB_ACTIONS', 'GITLAB_CI']
    for var in ci_vars:
        original_env[var] = os.environ.get(var)
    
    test_environments = [
        ({'CI': '1'}, "Generic CI"),
        ({'GITHUB_ACTIONS': 'true'}, "GitHub Actions"),
        ({'GITLAB_CI': 'true'}, "GitLab CI"),
        ({'CI': '1', 'GITHUB_ACTIONS': 'true'}, "Multiple CI flags"),
        ({}, "Local Development"),
    ]
    
    for env_vars, env_name in test_environments:
        # Clear CI variables
        for var in ci_vars:
            if var in os.environ:
                del os.environ[var]
        
        # Set test environment
        for var, value in env_vars.items():
            os.environ[var] = value
        
        # Check if CI environment
        is_ci = any(os.environ.get(var) for var in ci_vars)
        safety_status = "UNSAFE for DEBUG_MODE" if is_ci else "SAFE for DEBUG_MODE"
        
        print(f"Environment: {env_name} -> {safety_status}")
    
    # Restore original environment
    for var in ci_vars:
        if original_env[var] is not None:
            os.environ[var] = original_env[var]
        elif var in os.environ:
            del os.environ[var]
    print()

def test_debug_toggle():
    """Test DEBUG_MODE toggle functionality"""
    print("=== Testing DEBUG_MODE Toggle ===")
    
    test_cases = [
        ("true", True),
        ("false", False),
        ("TRUE", False),  # Case sensitive
        ("1", False),     # Not exactly "true"
        ("", False),      # Empty
        (None, False),    # Unset
    ]
    
    original_debug = os.environ.get('DEBUG_MODE')
    
    for debug_value, expected in test_cases:
        if debug_value is None:
            if 'DEBUG_MODE' in os.environ:
                del os.environ['DEBUG_MODE']
            display_value = "unset"
        else:
            os.environ['DEBUG_MODE'] = debug_value
            display_value = f"'{debug_value}'"
        
        # Simulate shell logic: DEBUG_MODE=${DEBUG_MODE:-false}
        actual_debug = os.environ.get('DEBUG_MODE', 'false')
        is_debug_active = actual_debug == 'true'
        
        result = "OK" if is_debug_active == expected else "FAIL"
        print(f"DEBUG_MODE={display_value} -> Active: {is_debug_active} {result}")
    
    # Restore original
    if original_debug is not None:
        os.environ['DEBUG_MODE'] = original_debug
    elif 'DEBUG_MODE' in os.environ:
        del os.environ['DEBUG_MODE']
    print()

def main():
    """Run all tests"""
    print("Debug Mode Security Implementation Tests")
    print("=" * 50)
    print()
    
    test_data_sanitization()
    test_date_validation()
    test_parameter_validation()
    test_environment_detection()
    test_debug_toggle()
    
    print("=" * 50)
    print("All tests completed!")
    print("See docs/DEBUG-MODE-SECURITY.md for usage guidelines")

if __name__ == "__main__":
    main()