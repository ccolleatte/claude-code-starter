#!/usr/bin/env python3
"""
Demo Pattern - Example implementation
Demonstrates best practices for pattern development
"""

import os
import logging
from typing import Optional, Dict, Any
import json
import re

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class DemoClass:
    """
    Demonstration class showing best practices
    
    This class provides a template for implementing patterns
    with proper error handling, validation, and documentation.
    """
    
    def __init__(self, config: Optional[Dict[str, Any]] = None):
        """
        Initialize the demo class
        
        Args:
            config: Optional configuration dictionary
        """
        self.config = config or {}
        self.debug_mode = self._get_debug_mode()
        
        # Load API key securely
        self.api_key = os.getenv('DEMO_API_KEY')
        if not self.api_key:
            logger.warning("DEMO_API_KEY not set - some features may be limited")
    
    def _get_debug_mode(self) -> bool:
        """Get debug mode from environment"""
        debug_env = os.getenv('DEMO_DEBUG', 'false').lower()
        return debug_env in ('true', '1', 'yes', 'on')
    
    def validate_input(self, data: str) -> bool:
        """
        Validate input data
        
        Args:
            data: Input string to validate
            
        Returns:
            True if valid, False otherwise
        """
        if not isinstance(data, str):
            return False
        
        if len(data) == 0:
            return False
        
        # Check for suspicious patterns
        suspicious_patterns = [
            r'<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>',  # Script tags
            r'javascript:',  # JavaScript URLs
            r'on\w+\s*=',   # Event handlers
        ]
        
        for pattern in suspicious_patterns:
            if re.search(pattern, data, re.IGNORECASE):
                logger.warning(f"Suspicious pattern detected in input: {pattern}")
                return False
        
        return True
    
    def process_data(self, data: str) -> Dict[str, Any]:
        """
        Process input data safely
        
        Args:
            data: Input data to process
            
        Returns:
            Processed data dictionary
            
        Raises:
            ValueError: If input is invalid
        """
        if not self.validate_input(data):
            raise ValueError("Invalid input data")
        
        # Log processing in debug mode
        if self.debug_mode:
            logger.debug(f"Processing data: {data[:50]}...")
        
        # Simulate processing
        result = {
            'input': data,
            'length': len(data),
            'processed_at': self._get_timestamp(),
            'status': 'success'
        }
        
        # Add API-dependent features if available
        if self.api_key:
            result['api_available'] = True
            result['enhanced_features'] = True
        else:
            result['api_available'] = False
            result['enhanced_features'] = False
        
        return result
    
    def _get_timestamp(self) -> str:
        """Get current timestamp"""
        from datetime import datetime
        return datetime.now().isoformat()
    
    def save_result(self, result: Dict[str, Any], filename: str) -> bool:
        """
        Save result to file
        
        Args:
            result: Result dictionary to save
            filename: Output filename
            
        Returns:
            True if successful, False otherwise
        """
        try:
            # Validate filename to prevent path traversal
            if not re.match(r'^[a-zA-Z0-9_-]+\.json$', filename):
                logger.error("Invalid filename format")
                return False
            
            with open(filename, 'w') as f:
                json.dump(result, f, indent=2)
            
            logger.info(f"Result saved to {filename}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to save result: {e}")
            return False

def main():
    """Main entry point for command line usage"""
    import argparse
    
    parser = argparse.ArgumentParser(description="Demo Pattern CLI")
    parser.add_argument("data", help="Data to process")
    parser.add_argument("--output", help="Output file (JSON format)")
    parser.add_argument("--debug", action="store_true", help="Enable debug mode")
    
    args = parser.parse_args()
    
    # Set debug mode from command line
    if args.debug:
        os.environ['DEMO_DEBUG'] = 'true'
    
    # Create and use demo class
    demo = DemoClass()
    
    try:
        result = demo.process_data(args.data)
        
        if args.output:
            if demo.save_result(result, args.output):
                print(f"Result saved to {args.output}")
            else:
                print("Failed to save result")
                return 1
        else:
            print(json.dumps(result, indent=2))
        
        return 0
        
    except ValueError as e:
        print(f"Error: {e}")
        return 1

if __name__ == "__main__":
    exit(main())