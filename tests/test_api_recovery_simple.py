#!/usr/bin/env python3
"""
Simple API Error Recovery Test
Tests retry logic and debug mode functionality
"""

import os
import subprocess
import sys
from pathlib import Path

def run_command(cmd, env_vars=None):
    """Run command with optional environment variables"""
    env = os.environ.copy()
    if env_vars:
        env.update(env_vars)
    
    try:
        result = subprocess.run(
            cmd, 
            shell=True, 
            capture_output=True, 
            text=True, 
            env=env,
            timeout=30
        )
        return result.returncode, result.stdout, result.stderr
    except subprocess.TimeoutExpired:
        return -1, "", "Command timed out"
    except Exception as e:
        return -1, "", str(e)

def test_debug_mode():
    """Test debug mode in claude-metrics.sh"""
    print("Testing debug mode in metrics...")
    
    exit_code, stdout, stderr = run_command(
        "bash scripts/claude-metrics.sh dashboard 1",
        {"DEBUG_MODE": "true"}
    )
    
    print(f"Exit code: {exit_code}")
    print(f"Output length: {len(stdout)} chars")
    
    # Check for debug output
    has_debug = "DEBUG:" in stdout or "DEBUG:" in stderr
    print(f"Debug output detected: {has_debug}")
    
    return exit_code == 0

def test_retry_examples():
    """Test retry logic examples"""
    print("Testing retry logic examples...")
    
    exit_code, stdout, stderr = run_command(
        "bash scripts/retry-logic.sh examples",
        {"DEBUG_MODE": "true"}
    )
    
    print(f"Exit code: {exit_code}")
    print(f"Output contains examples: {'retry_with_backoff' in stdout}")
    
    return exit_code == 0

def test_environment_validation():
    """Test environment validation"""
    print("Testing environment validation...")
    
    # Test with missing variable (should fail)
    exit_code, stdout, stderr = run_command(
        "bash scripts/retry-logic.sh validate-env MISSING_VAR_12345",
        {"DEBUG_MODE": "true"}
    )
    
    print(f"Exit code: {exit_code}")
    should_fail = exit_code != 0
    print(f"Expected failure occurred: {should_fail}")
    
    return should_fail

def test_security_scan():
    """Test security monitoring"""
    print("Testing security scan...")
    
    exit_code, stdout, stderr = run_command(
        "bash scripts/security-monitor.sh scan",
        {"DEBUG_MODE": "true"}
    )
    
    print(f"Exit code: {exit_code}")
    print(f"Scan completed: {exit_code == 0}")
    
    return exit_code == 0

def main():
    """Run all tests"""
    print("Starting API Error Recovery Tests")
    print("=" * 40)
    
    tests = [
        ("Debug Mode Test", test_debug_mode),
        ("Retry Examples", test_retry_examples),
        ("Environment Validation", test_environment_validation),
        ("Security Scan", test_security_scan),
    ]
    
    results = []
    for test_name, test_func in tests:
        print(f"\nRunning: {test_name}")
        print("-" * 30)
        
        try:
            success = test_func()
            status = "[PASS]" if success else "[FAIL]"
            print(f"{status} {test_name}")
            results.append((test_name, success))
        except Exception as e:
            print(f"[ERROR] {test_name}: {e}")
            results.append((test_name, False))
    
    # Summary
    print("\n" + "=" * 40)
    print("Test Results Summary")
    print("=" * 40)
    
    passed = sum(1 for _, success in results if success)
    total = len(results)
    
    for test_name, success in results:
        status = "[PASS]" if success else "[FAIL]"
        print(f"{status} {test_name}")
    
    print(f"\nTotal: {passed}/{total} tests passed")
    
    if passed == total:
        print("All tests passed!")
        return 0
    else:
        print("Some tests failed.")
        return 1

if __name__ == "__main__":
    exit(main())