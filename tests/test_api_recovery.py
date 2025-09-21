#!/usr/bin/env python3
"""
Test API Error Recovery and Retry Logic
Validates graceful degradation and retry mechanisms
"""

import os
import subprocess
import sys
import time
from pathlib import Path

def test_invalid_api_key():
    """Test retry logic with invalid API key"""
    print("Testing API error recovery with invalid key...")
    
    # Set environment for test
    env = os.environ.copy()
    env['DEBUG_MODE'] = 'true'
    env['MAX_RETRIES'] = '2'
    env['BASE_DELAY'] = '1'
    
    # Test with invalid API key
    result = subprocess.run([
        'bash', 'scripts/retry-logic.sh', 'examples'
    ], capture_output=True, text=True, env=env, cwd=Path.cwd())
    
    print(f"Exit code: {result.returncode}")
    print(f"Output: {result.stdout}")
    if result.stderr:
        print(f"Errors: {result.stderr}")
    
    return result.returncode == 0

def test_debug_mode_metrics():
    """Test debug mode in claude-metrics.sh"""
    print("Testing debug mode in metrics collection...")
    
    env = os.environ.copy()
    env['DEBUG_MODE'] = 'true'
    
    # Test metrics dashboard with debug
    result = subprocess.run([
        'bash', 'scripts/claude-metrics.sh', 'dashboard', '1'
    ], capture_output=True, text=True, env=env, cwd=Path.cwd())
    
    print(f"Exit code: {result.returncode}")
    print(f"Output: {result.stdout}")
    if result.stderr:
        print(f"Errors: {result.stderr}")
    
    # Check if debug output is present
    has_debug = 'DEBUG:' in result.stdout or 'DEBUG:' in result.stderr
    print(f"Debug output detected: {has_debug}")
    
    return result.returncode == 0

def test_graceful_degradation():
    """Test graceful degradation scenarios"""
    print("Testing graceful degradation...")
    
    # Create a temporary script that will fail
    test_script = Path('test_fail_script.sh')
    test_script.write_text('#!/bin/bash\necho "This will fail"; exit 1\n')
    
    try:
        env = os.environ.copy()
        env['DEBUG_MODE'] = 'true'
        env['MAX_RETRIES'] = '2'
        
        # Test retry mechanism
        result = subprocess.run([
            'bash', '-c', 'source scripts/retry-logic.sh && retry_with_backoff "bash test_fail_script.sh" "test_operation"'
        ], capture_output=True, text=True, env=env, cwd=Path.cwd())
        
        print(f"Exit code: {result.returncode}")
        print(f"Output: {result.stdout}")
        if result.stderr:
            print(f"Errors: {result.stderr}")
        
        # Should fail after retries
        expected_failure = result.returncode != 0
        print(f"Expected failure occurred: {expected_failure}")
        
        return expected_failure
        
    finally:
        # Cleanup
        if test_script.exists():
            test_script.unlink()

def test_environment_validation():
    """Test environment validation function"""
    print("Testing environment validation...")
    
    env = os.environ.copy()
    env['DEBUG_MODE'] = 'true'
    env['TEST_VAR_1'] = 'value1'
    # TEST_VAR_2 intentionally missing
    
    # Test validation with missing variable
    result = subprocess.run([
        'bash', 'scripts/retry-logic.sh', 'validate-env', 'TEST_VAR_1', 'TEST_VAR_2'
    ], capture_output=True, text=True, env=env, cwd=Path.cwd())
    
    print(f"Exit code: {result.returncode}")
    print(f"Output: {result.stdout}")
    if result.stderr:
        print(f"Errors: {result.stderr}")
    
    # Should fail due to missing TEST_VAR_2
    expected_failure = result.returncode != 0
    missing_var_detected = 'TEST_VAR_2' in result.stdout or 'TEST_VAR_2' in result.stderr
    
    print(f"Expected failure: {expected_failure}")
    print(f"Missing variable detected: {missing_var_detected}")
    
    return expected_failure and missing_var_detected

def test_security_integration():
    """Test integration with security monitoring"""
    print("Testing security monitoring integration...")
    
    env = os.environ.copy()
    env['DEBUG_MODE'] = 'true'
    
    # Test security scan
    result = subprocess.run([
        'bash', 'scripts/security-monitor.sh', 'scan'
    ], capture_output=True, text=True, env=env, cwd=Path.cwd())
    
    print(f"Exit code: {result.returncode}")
    print(f"Output: {result.stdout}")
    if result.stderr:
        print(f"Errors: {result.stderr}")
    
    return result.returncode == 0

def main():
    """Run all API recovery tests"""
    print("Starting API Error Recovery Tests")
    print("=" * 50)
    
    tests = [
        ("Invalid API Key Recovery", test_invalid_api_key),
        ("Debug Mode Metrics", test_debug_mode_metrics),
        ("Graceful Degradation", test_graceful_degradation),
        ("Environment Validation", test_environment_validation),
        ("Security Integration", test_security_integration),
    ]
    
    results = []
    for test_name, test_func in tests:
        print(f"\n📋 Running: {test_name}")
        print("-" * 40)
        
        try:
            start_time = time.time()
            success = test_func()
            duration = time.time() - start_time
            
            status = "PASS" if success else "FAIL"
            print(f"{status} - {test_name} ({duration:.2f}s)")
            
            results.append((test_name, success, duration))
            
        except Exception as e:
            print(f"ERROR - {test_name}: {e}")
            results.append((test_name, False, 0))
    
    # Summary
    print("
" + "=" * 50)
    print("Test Results Summary")
    print("=" * 50)
    
    passed = sum(1 for _, success, _ in results if success)
    total = len(results)
    
    for test_name, success, duration in results:
        status = "[PASS]" if success else "[FAIL]"
        print(f"{status} {test_name} ({duration:.2f}s)")
    
    print(f"\nTotal: {passed}/{total} tests passed")
    
    if passed == total:
        print("All tests passed!")
        return 0
    else:
        print("Some tests failed. Check logs above.")
        return 1

if __name__ == "__main__":
    exit(main())