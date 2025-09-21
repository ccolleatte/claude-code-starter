#!/usr/bin/env python3
"""
Comprehensive French Translation Validation Tests
Priority 2: Test validation French translations - Target 90% coverage
"""
import os
import unittest
import re
from pathlib import Path

class TestFrenchValidationComprehensive(unittest.TestCase):
    """Comprehensive validation of French translations"""
    
    def setUp(self):
        """Setup test environment"""
        self.project_root = Path(__file__).parent.parent.parent
        self.french_files = [
            self.project_root / ".claude" / "CLAUDE-FR.md",
            self.project_root / "README-FR.md", 
            self.project_root / ".claude" / "CLAUDE-WORKFLOWS-FR.md",
            self.project_root / "docs" / "claude" / "MONITORING-FR.md"
        ]
        
        # French terminology standards
        self.required_french_terms = [
            'configuration', 'instructions', 'règles', 'validation',
            'structure', 'sécurité', 'surveillance', 'métriques',
            'performance', 'qualité'
        ]
        
        # Technical terms that should remain in English
        self.allowed_english_terms = [
            'workflow', 'framework', 'pipeline', 'dashboard',
            'monitoring', 'prompt', 'agent', 'commit', 'merge',
            'pull request', 'pattern', 'template'
        ]
    
    def test_all_french_files_exist(self):
        """Test that all French translation files exist"""
        for file_path in self.french_files:
            with self.subTest(file=file_path.name):
                self.assertTrue(file_path.exists(), f"French file {file_path.name} should exist")
                self.assertGreater(file_path.stat().st_size, 0, f"French file {file_path.name} should not be empty")
    
    def test_french_files_encoding(self):
        """Test that French files use proper UTF-8 encoding"""
        for file_path in self.french_files:
            with self.subTest(file=file_path.name):
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                        self.assertIsInstance(content, str, f"File {file_path.name} should be readable as UTF-8")
                except UnicodeDecodeError:
                    self.fail(f"File {file_path.name} has encoding issues")
    
    def test_french_terminology_consistency(self):
        """Test French terminology consistency across files"""
        terminology_usage = {}
        
        for file_path in self.french_files:
            if not file_path.exists():
                continue
                
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read().lower()
            
            for term in self.required_french_terms:
                count = content.count(term.lower())
                if term not in terminology_usage:
                    terminology_usage[term] = 0
                terminology_usage[term] += count
        
        # At least 8 out of 10 terms should be used
        used_terms = sum(1 for count in terminology_usage.values() if count > 0)
        self.assertGreaterEqual(used_terms, 8, 
                               f"Should use at least 8/10 French terms. Used: {used_terms}")
    
    def test_technical_command_preservation(self):
        """Test that technical commands and code blocks are preserved"""
        command_patterns = [
            r'```bash\n.*?\n```',
            r'```yaml\n.*?\n```', 
            r'```javascript\n.*?\n```',
            r'`[^`]+`',  # Inline code
            r'npm run \w+',
            r'git \w+',
            r'python \S+\.py'
        ]
        
        for file_path in self.french_files:
            if not file_path.exists():
                continue
                
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            with self.subTest(file=file_path.name):
                # Should contain technical commands
                has_commands = any(re.search(pattern, content, re.MULTILINE | re.DOTALL) 
                                 for pattern in command_patterns)
                self.assertTrue(has_commands, f"File {file_path.name} should contain technical commands")
    
    def test_markdown_structure_integrity(self):
        """Test that markdown structure is properly maintained"""
        for file_path in self.french_files:
            if not file_path.exists():
                continue
                
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            with self.subTest(file=file_path.name):
                # Check headers
                headers = re.findall(r'^#+\s+(.+)$', content, re.MULTILINE)
                self.assertGreater(len(headers), 0, f"File {file_path.name} should have headers")
                
                # Check lists
                lists = re.findall(r'^[\s]*[-*+]\s+', content, re.MULTILINE)
                if file_path.name in ['README-FR.md', 'CLAUDE-WORKFLOWS-FR.md']:
                    self.assertGreater(len(lists), 5, f"File {file_path.name} should have multiple list items")
                
                # Check links
                links = re.findall(r'\[([^\]]+)\]\(([^)]+)\)', content)
                if file_path.name == 'README-FR.md':
                    self.assertGreater(len(links), 3, f"README-FR.md should have multiple links")
    
    def test_french_translation_completeness(self):
        """Test translation completeness by checking key sections"""
        section_mappings = {
            'CLAUDE-FR.md': ['règles absolues', 'conditions d\'arrêt', 'commandes essentielles'],
            'README-FR.md': ['Claude Starter Kit', 'Installation', 'Utilisation'],
            'CLAUDE-WORKFLOWS-FR.md': ['Flux de travail', 'Processus', 'Validation'],
            'MONITORING-FR.md': ['Surveillance', 'Métriques', 'Configuration']
        }
        
        for file_path in self.french_files:
            if not file_path.exists():
                continue
                
            file_name = file_path.name
            if file_name not in section_mappings:
                continue
            
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            expected_sections = section_mappings[file_name]
            with self.subTest(file=file_name):
                for section in expected_sections:
                    self.assertIn(section.lower(), content.lower(),
                                f"File {file_name} should contain section about '{section}'")
    
    def test_no_broken_internal_links(self):
        """Test that internal links in French files are not broken"""
        for file_path in self.french_files:
            if not file_path.exists():
                continue
                
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Find internal markdown links
            internal_links = re.findall(r'\[([^\]]+)\]\(([^)]+\.md[^)]*)\)', content)
            
            with self.subTest(file=file_path.name):
                for link_text, link_path in internal_links:
                    if link_path.startswith('http'):
                        continue  # Skip external links
                    
                    # Resolve relative path
                    if link_path.startswith('./'):
                        target_path = file_path.parent / link_path[2:]
                    elif link_path.startswith('/'):
                        target_path = self.project_root / link_path[1:]
                    else:
                        target_path = file_path.parent / link_path
                    
                    # Check if target exists (ignore anchors)
                    target_file = str(target_path).split('#')[0]
                    target_path_clean = Path(target_file)
                    
                    self.assertTrue(target_path_clean.exists(),
                                  f"Internal link in {file_path.name} points to non-existent file: {link_path}")
    
    def test_accent_and_special_character_handling(self):
        """Test proper handling of French accents and special characters"""
        expected_accents = ['é', 'è', 'à', 'ç', 'ù', 'ê', 'â', 'î', 'ô']
        
        for file_path in self.french_files:
            if not file_path.exists():
                continue
                
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            with self.subTest(file=file_path.name):
                # Should contain French accents (proves it's actually French)
                has_accents = any(accent in content for accent in expected_accents)
                self.assertTrue(has_accents, f"French file {file_path.name} should contain accented characters")
                
                # Should not contain replacement characters (encoding issues)
                self.assertNotIn('�', content, f"File {file_path.name} should not contain replacement characters")
    
    def test_code_block_syntax_preservation(self):
        """Test that code blocks maintain proper syntax"""
        for file_path in self.french_files:
            if not file_path.exists():
                continue
                
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Find code blocks
            code_blocks = re.findall(r'```(\w+)?\n(.*?)\n```', content, re.DOTALL)
            
            with self.subTest(file=file_path.name):
                for lang, code in code_blocks:
                    # Bash commands should not be translated
                    if lang == 'bash':
                        # Check that common bash commands are preserved
                        bash_commands = ['npm', 'git', 'python', 'echo', 'cd', 'ls', 'mkdir']
                        if any(cmd in code for cmd in bash_commands):
                            for cmd in bash_commands:
                                if cmd in code:
                                    # Command should not be followed by French translation
                                    lines_with_cmd = [line for line in code.split('\n') if cmd in line]
                                    for line in lines_with_cmd:
                                        self.assertNotRegex(line, rf'{cmd}\s+#.*français',
                                                          f"Bash command '{cmd}' should not have French comments in {file_path.name}")
    
    def test_french_translation_quality_indicators(self):
        """Test indicators of translation quality"""
        quality_indicators = {
            'professional_terms': ['configuration', 'validation', 'intégration', 'surveillance'],
            'technical_accuracy': ['API', 'JSON', 'YAML', 'CLI', 'SDK'],
            'proper_grammar': [':', ';', '!', '?']  # Proper punctuation usage
        }
        
        for file_path in self.french_files:
            if not file_path.exists():
                continue
                
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            with self.subTest(file=file_path.name):
                # Check professional terminology usage
                prof_terms_found = sum(1 for term in quality_indicators['professional_terms'] 
                                     if term in content.lower())
                self.assertGreaterEqual(prof_terms_found, 2,
                                      f"File {file_path.name} should use professional French terms")
                
                # Check technical terms are preserved
                tech_terms_found = sum(1 for term in quality_indicators['technical_accuracy']
                                     if term in content)
                if file_path.name in ['README-FR.md', 'CLAUDE-WORKFLOWS-FR.md']:
                    self.assertGreaterEqual(tech_terms_found, 1,
                                          f"File {file_path.name} should preserve technical terms")

if __name__ == '__main__':
    unittest.main()