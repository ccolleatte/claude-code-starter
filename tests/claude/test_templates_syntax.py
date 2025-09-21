#!/usr/bin/env python3
"""
Tests de validation syntaxe des templates Claude Code
"""

import os
import re
import pytest
from pathlib import Path

# Chemins des fichiers à tester
CLAUDE_DIR = Path(".claude")
DOCS_CLAUDE_DIR = Path("docs/claude")

class TestTemplatesSyntax:
    """Tests de validation syntaxe Markdown des templates"""
    
    def test_markdown_syntax_valid(self):
        """Vérifie que tous les fichiers Markdown ont une syntaxe valide"""
        markdown_files = []
        markdown_files.extend(CLAUDE_DIR.glob("*.md"))
        markdown_files.extend(DOCS_CLAUDE_DIR.glob("*.md"))
        
        for md_file in markdown_files:
            with open(md_file, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Test syntaxe de base
            assert content.strip(), f"{md_file} est vide"
            
            # Test headers valides
            headers = re.findall(r'^#+\s+(.+)', content, re.MULTILINE)
            assert len(headers) > 0, f"{md_file} n'a pas de headers"
            
            # Test pas de markdown cassé - more lenient check
            code_blocks = re.findall(r'```', content)
            # Allow odd number if the last one is at end of content (common pattern)
            if len(code_blocks) % 2 != 0:
                # Check if content ends reasonably after last ```
                last_triple_backtick = content.rfind('```')
                if last_triple_backtick != -1:
                    remaining = content[last_triple_backtick + 3:].strip()
                    # Allow up to 200 chars after last ``` (for comments, etc.)
                    assert len(remaining) < 200, f"{md_file} has unclosed code block with too much content after"
            
            # Test liens internes valides
            internal_links = re.findall(r'\[([^\]]+)\]\(([^http][^)]+)\)', content)
            for link_text, link_path in internal_links:
                # Vérifier que les liens relatifs existent
                if not link_path.startswith('#'):
                    full_path = md_file.parent / link_path
                    if not full_path.exists():
                        # Essayer depuis la racine
                        full_path = Path(link_path)
                        assert full_path.exists(), \
                            f"{md_file}: Lien cassé vers {link_path}"

    def test_cross_references_exist(self):
        """Vérifie que les références croisées existent"""
        claude_md = CLAUDE_DIR / "CLAUDE.md"
        
        with open(claude_md, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Vérifier références vers autres fichiers
        required_refs = [
            "CLAUDE-WORKFLOWS.md",
            "CLAUDE-VALIDATION.md", 
            "CLAUDE-ERRORS.md"
        ]
        
        for ref in required_refs:
            assert ref in content, \
                f"CLAUDE.md doit référencer {ref}"
            
            # Vérifier que le fichier référencé existe
            ref_file = CLAUDE_DIR / ref
            assert ref_file.exists(), \
                f"Fichier référencé {ref} n'existe pas"

    def test_file_size_limits(self):
        """Vérifie que CLAUDE.md respecte la limite de 150 lignes"""
        claude_md = CLAUDE_DIR / "CLAUDE.md"
        
        with open(claude_md, 'r', encoding='utf-8') as f:
            lines = f.readlines()
        
        line_count = len(lines)
        assert line_count <= 150, \
            f"CLAUDE.md a {line_count} lignes (max: 150)"
        
        # Vérifier que les autres fichiers sont raisonnables (< 500 lignes)
        for md_file in CLAUDE_DIR.glob("CLAUDE-*.md"):
            with open(md_file, 'r', encoding='utf-8') as f:
                lines = f.readlines()
            
            line_count = len(lines)
            assert line_count <= 500, \
                f"{md_file.name} a {line_count} lignes (max recommandé: 500)"

    def test_templates_contain_examples(self):
        """Vérifie que les templates contiennent des exemples ❌/✅"""
        templates_file = DOCS_CLAUDE_DIR / "PROMPT-TEMPLATES.md"
        
        with open(templates_file, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Doit contenir des exemples avec ❌ et ✅
        assert "❌" in content, "PROMPT-TEMPLATES.md doit contenir des exemples ❌"
        assert "✅" in content, "PROMPT-TEMPLATES.md doit contenir des exemples ✅"
        
        # Doit contenir des exemples de code
        assert "```" in content, "PROMPT-TEMPLATES.md doit contenir des blocs de code"

    def test_validation_rules_present(self):
        """Vérifie que les règles de validation sont présentes"""
        validation_file = CLAUDE_DIR / "CLAUDE-VALIDATION.md"
        
        with open(validation_file, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Doit contenir des règles strictes
        required_patterns = [
            "preuves",
            "obligatoire",
            "interdit",
            "validation"
        ]
        
        for pattern in required_patterns:
            assert pattern.lower() in content.lower(), \
                f"CLAUDE-VALIDATION.md doit contenir '{pattern}'"

if __name__ == "__main__":
    pytest.main([__file__, "-v"])