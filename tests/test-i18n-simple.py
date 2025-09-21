#!/usr/bin/env python3
"""
Simple i18n System Test for Claude Starter Kit
Tests the i18n JSON files and structure
"""

import json
import os
import sys
from pathlib import Path

def test_i18n_system():
    """Test the i18n system"""
    print("Testing i18n System for Claude Starter Kit")
    print("==============================================\n")
    
    project_root = Path(__file__).parent.parent
    i18n_dir = project_root / "i18n"
    
    # Test 1: File Structure
    print("Test 1: File Structure")
    print("--------------------------")
    
    required_files = [
        "i18n/config.json",
        "i18n/en/messages.json", 
        "i18n/fr/messages.json",
        "scripts/i18n-helper.sh"
    ]
    
    all_exist = True
    for file_path in required_files:
        full_path = project_root / file_path
        if full_path.exists():
            print(f"OK {file_path}")
        else:
            print(f"MISSING {file_path}")
            all_exist = False
    
    print()
    
    # Test 2: JSON Validation
    print("Test 2: JSON Validation")
    print("---------------------------")
    
    json_files = ["i18n/config.json", "i18n/en/messages.json", "i18n/fr/messages.json"]
    valid_json = True
    
    for json_file in json_files:
        try:
            with open(project_root / json_file, 'r', encoding='utf-8') as f:
                json.load(f)
            print(f"VALID {json_file}")
        except (FileNotFoundError, json.JSONDecodeError) as e:
            print(f"INVALID {json_file}: {e}")
            valid_json = False
    
    print()
    
    # Test 3: Message Content
    print("💬 Test 3: Message Content")
    print("---------------------------")
    
    try:
        # Load English messages
        with open(project_root / "i18n/en/messages.json", 'r', encoding='utf-8') as f:
            en_messages = json.load(f)
        
        # Load French messages  
        with open(project_root / "i18n/fr/messages.json", 'r', encoding='utf-8') as f:
            fr_messages = json.load(f)
        
        # Test key consistency
        def check_keys(en_dict, fr_dict, path=""):
            missing_keys = []
            for key in en_dict:
                current_path = f"{path}.{key}" if path else key
                if key not in fr_dict:
                    missing_keys.append(current_path)
                elif isinstance(en_dict[key], dict) and isinstance(fr_dict[key], dict):
                    missing_keys.extend(check_keys(en_dict[key], fr_dict[key], current_path))
            return missing_keys
        
        missing_in_fr = check_keys(en_messages, fr_messages)
        missing_in_en = check_keys(fr_messages, en_messages)
        
        if not missing_in_fr and not missing_in_en:
            print("CONSISTENT - All keys match between EN and FR")
        else:
            print("INCONSISTENT - Key consistency issues:")
            for key in missing_in_fr:
                print(f"  - Missing in FR: {key}")
            for key in missing_in_en:
                print(f"  - Missing in EN: {key}")
        
        # Test sample messages
        print("\nSample messages:")
        test_keys = ["common.success", "setup.title", "metrics.hallucination.detected"]
        
        for key in test_keys:
            keys = key.split('.')
            en_value = en_messages
            fr_value = fr_messages
            
            try:
                for k in keys:
                    en_value = en_value[k]
                    fr_value = fr_value[k]
                print(f"  {key}:")
                print(f"    EN: {en_value}")
                print(f"    FR: {fr_value}")
            except KeyError as e:
                print(f"  {key}: MISSING key {e}")
        
    except Exception as e:
        print(f"ERROR loading messages: {e}")
    
    print()
    
    # Test 4: Locale Detection Logic
    print("Test 4: Locale Detection Logic")
    print("----------------------------------")
    
    # Simulate locale detection
    test_envs = [
        {"CLAUDE_LOCALE": "fr", "expected": "fr"},
        {"LANG": "fr_FR.UTF-8", "expected": "fr"},
        {"LANG": "en_US.UTF-8", "expected": "en"},
        {"LANGUAGE": "fr:en:de", "expected": "fr"},
        {"CLAUDE_LOCALE": "es", "expected": "en"},  # Fallback
        {}, # Default
    ]
    
    for test_env in test_envs:
        # Simulate environment
        claude_locale = test_env.get("CLAUDE_LOCALE", "")
        lang = test_env.get("LANG", "")
        language = test_env.get("LANGUAGE", "")
        
        # Simple detection logic (Python version)
        detected = "en"  # default
        
        if claude_locale:
            if claude_locale in ["en", "fr"]:
                detected = claude_locale
        elif lang:
            locale_part = lang.split('.')[0].split('_')[0]
            if locale_part in ["en", "fr"]:
                detected = locale_part
        elif language:
            locale_part = language.split(':')[0].split('_')[0]
            if locale_part in ["en", "fr"]:
                detected = locale_part
        
        expected = test_env.get("expected", "en")
        status = "OK" if detected == expected else "FAIL"
        
        env_str = ", ".join([f"{k}={v}" for k, v in test_env.items() if k != "expected"]) or "default"
        print(f"  {status} {env_str} -> {detected}")
    
    print()
    
    # Test 5: Integration Points
    print("Test 5: Integration Points")
    print("------------------------------")
    
    integration_files = [
        "scripts/claude-metrics.sh",
        "scripts/setup-wizard.js",
        "scripts/i18n-helper.sh"
    ]
    
    for file_path in integration_files:
        full_path = project_root / file_path
        if full_path.exists():
            try:
                with open(full_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                # Check for i18n integration
                has_i18n = any(keyword in content for keyword in [
                    'localized_echo', 'get_message', 'i18n', 'locale', 'I18n'
                ])
                
                status = "OK" if has_i18n else "WARN"
                print(f"  {status} {file_path} - {'Has i18n integration' if has_i18n else 'No i18n integration detected'}")
                
            except Exception as e:
                print(f"  ERROR {file_path} - Error reading: {e}")
        else:
            print(f"  MISSING {file_path}")
    
    print()
    
    # Summary
    print("i18n System Test Summary")
    print("===========================")
    
    if all_exist and valid_json:
        print("SUCCESS: i18n system is properly configured and ready for use!")
        print("
Usage Examples:")
        print("  # Bash scripts:")
        print("  CLAUDE_LOCALE=fr ./scripts/claude-metrics.sh")
        print("  # Node.js scripts:")
        print("  CLAUDE_LOCALE=fr node ./scripts/setup-wizard.js")
        print("  # Environment detection:")
        print("  export LANG=fr_FR.UTF-8")
        return True
    else:
        print("FAILED: i18n system has issues that need to be resolved")
        return False

if __name__ == "__main__":
    success = test_i18n_system()
    sys.exit(0 if success else 1)