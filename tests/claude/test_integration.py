#!/usr/bin/env python3
"""
Tests d'intégration Claude Code Configuration
"""

import os
import json
import re
import pytest
from pathlib import Path

class TestClaudeIntegration:
    """Tests d'intégration du framework Claude Code"""
    
    def test_claude_loads_config(self):
        """Vérifie que Claude peut charger la configuration"""
        claude_dir = Path(".claude")
        
        # Vérifier structure de base
        assert claude_dir.exists(), "Répertoire .claude doit exister"
        assert (claude_dir / "CLAUDE.md").exists(), \
            "Fichier principal CLAUDE.md doit exister"
        
        # Vérifier fichiers de configuration
        config_files = [
            "CLAUDE.md",
            "CLAUDE-WORKFLOWS.md", 
            "CLAUDE-VALIDATION.md",
            "CLAUDE-ERRORS.md",
            "CLAUDE-SETTINGS.md"
        ]
        
        for config_file in config_files:
            file_path = claude_dir / config_file
            assert file_path.exists(), \
                f"Fichier de config {config_file} doit exister"
            
            # Vérifier que le fichier n'est pas vide
            assert file_path.stat().st_size > 0, \
                f"Fichier {config_file} ne peut pas être vide"

    def test_permissions_respected(self):
        """Vérifie que les permissions sont correctement configurées"""
        settings_file = Path(".claude/settings.local.json")
        
        if settings_file.exists():
            with open(settings_file, 'r') as f:
                settings = json.load(f)
            
            # Vérifier structure permissions
            if "permissions" in settings:
                perms = settings["permissions"]
                
                # Doit avoir au moins une permission allow
                assert "allow" in perms, \
                    "settings.local.json doit avoir section 'allow'"
                assert len(perms["allow"]) > 0, \
                    "Au moins une permission doit être autorisée"
                
                # Vérifier permissions dangereuses dans deny
                if "deny" in perms:
                    dangerous_patterns = [
                        "rm -rf",
                        "sudo",
                        "*API_KEY*",
                        "*SECRET*",
                        "*PASSWORD*"
                    ]
                    
                    denied_commands = perms["deny"]
                    for dangerous in dangerous_patterns:
                        has_protection = any(
                            dangerous.lower() in cmd.lower() 
                            for cmd in denied_commands
                        )
                        if not has_protection:
                            print(f"Warning: Pattern dangereux '{dangerous}' non bloqué")

    def test_no_hallucination_patterns(self):
        """Vérifie qu'il n'y a pas de patterns d'hallucination"""
        claude_md = Path(".claude/CLAUDE.md")
        
        with open(claude_md, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Vérifier présence de règles anti-hallucination
        anti_hallucination_keywords = [
            "jamais créer",
            "toujours prouver", 
            "output réel",
            "vérifier",
            "analyser"
        ]
        
        found_keywords = 0
        for keyword in anti_hallucination_keywords:
            if keyword.lower() in content.lower():
                found_keywords += 1
        
        assert found_keywords >= 3, \
            f"CLAUDE.md doit contenir au moins 3 règles anti-hallucination (trouvé: {found_keywords})"

    def test_structure_coherence(self):
        """Vérifie la cohérence de la structure globale"""
        # Vérifier symlink CLAUDE.md racine
        root_claude = Path("CLAUDE.md")
        claude_claude = Path(".claude/CLAUDE.md")
        
        assert root_claude.exists(), \
            "CLAUDE.md doit exister à la racine (symlink ou fichier)"
        assert claude_claude.exists(), \
            ".claude/CLAUDE.md doit exister"
        
        # Vérifier que .gitignore protège les fichiers sensibles
        gitignore = Path(".gitignore")
        if gitignore.exists():
            with open(gitignore, 'r') as f:
                gitignore_content = f.read()
            
            protected_patterns = [
                ".env",
                "settings.local.json",
                "*.log"
            ]
            
            for pattern in protected_patterns:
                assert pattern in gitignore_content, \
                    f".gitignore doit protéger {pattern}"

    def test_documentation_completeness(self):
        """Vérifie que la documentation est complète"""
        docs_dir = Path("docs/claude")
        
        required_docs = [
            "PROMPT-TEMPLATES.md",
            "INTEGRATION-PERMISSIONS.md", 
            "MIGRATION-GUIDE.md"
        ]
        
        for doc in required_docs:
            doc_path = docs_dir / doc
            assert doc_path.exists(), \
                f"Documentation {doc} doit exister"
            
            # Vérifier contenu minimal
            with open(doc_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            assert len(content) > 1000, \
                f"Documentation {doc} semble incomplète (<1000 chars)"

    def test_backup_and_security(self):
        """Vérifie les mesures de backup et sécurité"""
        # Vérifier backup CLAUDE.md
        backup_files = list(Path(".").glob("CLAUDE.md.v40.backup.*"))
        assert len(backup_files) > 0, \
            "Au moins un backup CLAUDE.md doit exister"
        
        # Vérifier rapport de sécurité
        security_setup = Path("SECURITY-SETUP.md")
        assert security_setup.exists(), \
            "Documentation sécurité SECURITY-SETUP.md doit exister"
        
        # Vérifier que .env ne contient pas de vraies clés en dur
        env_file = Path(".env")
        if env_file.exists():
            with open(env_file, 'r') as f:
                env_content = f.read()
            
            # Pattern simple pour détecter les clés exposées précédentes
            old_exposed_patterns = [
                "sk-ant-api03-Ny1E3hG",  # Ancienne clé exposée
                "2a89fc42-2a13-4a06-b529-ceda509988ed"  # Ancienne clé Exa
            ]
            
            for pattern in old_exposed_patterns:
                assert pattern not in env_content, \
                    f"Ancienne clé exposée {pattern[:20]}... encore présente"

    def test_mcp_scripts_integration(self):
        """Vérifie l'intégration des scripts MCP"""
        scripts_dir = Path(".claude/scripts")
        
        expected_scripts = [
            "cipher-mcp.sh",
            "serena-mcp.sh", 
            "semgrep-mcp.sh",
            "exa-mcp.sh"
        ]
        
        for script_name in expected_scripts:
            script_path = scripts_dir / script_name
            assert script_path.exists(), \
                f"Script MCP {script_name} doit exister"
            
            # Vérifier que le script charge les bonnes variables
            with open(script_path, 'r') as f:
                content = f.read()
            
            if "cipher" in script_name:
                assert "ANTHROPIC_API_KEY" in content, \
                    "cipher-mcp.sh doit utiliser ANTHROPIC_API_KEY"
            
            if "exa" in script_name:
                assert "EXA_API_KEY" in content, \
                    "exa-mcp.sh doit utiliser EXA_API_KEY"

if __name__ == "__main__":
    pytest.main([__file__, "-v"])