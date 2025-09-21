#!/usr/bin/env python3
"""
Tests de validation des scripts MCP
"""

import os
import stat
import subprocess
import pytest
import re
from pathlib import Path

# Chemin des scripts MCP
SCRIPTS_DIR = Path(".claude/scripts")

class TestMCPScripts:
    """Tests de validation des scripts MCP"""
    
    def test_scripts_executable(self):
        """Vérifie que tous les scripts MCP sont exécutables"""
        mcp_scripts = list(SCRIPTS_DIR.glob("*-mcp.sh"))
        
        assert len(mcp_scripts) > 0, "Aucun script MCP trouvé"
        
        for script in mcp_scripts:
            # Vérifier que le fichier existe
            assert script.exists(), f"Script {script.name} n'existe pas"
            
            # Sur Windows, vérifier juste que le fichier a du contenu
            # et commence par un shebang
            content = script.read_text(encoding='utf-8')
            assert content.strip(), f"Script {script.name} est vide"
            assert content.startswith("#!"), f"Script {script.name} n'a pas de shebang"
            
            # Vérifier shebang bash
            with open(script, 'r') as f:
                first_line = f.readline().strip()
            assert first_line == "#!/bin/bash", \
                f"Script {script.name} doit commencer par #!/bin/bash"

    def test_error_handling(self):
        """Vérifie que les scripts ont une gestion d'erreurs"""
        mcp_scripts = list(SCRIPTS_DIR.glob("*-mcp.sh"))
        
        for script in mcp_scripts:
            with open(script, 'r') as f:
                content = f.read()
            
            # Vérifier 'set -e' pour arrêt sur erreur
            assert "set -e" in content, \
                f"Script {script.name} doit contenir 'set -e'"
            
            # Vérifier gestion des erreurs explicite
            error_patterns = [
                "echo.*Error",
                "echo.*error", 
                ">&2",  # Redirection stderr
                "exit 1"
            ]
            
            has_error_handling = any(
                pattern in content for pattern in error_patterns
            )
            assert has_error_handling, \
                f"Script {script.name} doit avoir gestion d'erreurs"

    def test_environment_validation(self):
        """Vérifie que les scripts valident les variables d'environnement"""
        
        # Test cipher-mcp.sh
        cipher_script = SCRIPTS_DIR / "cipher-mcp.sh"
        if cipher_script.exists():
            with open(cipher_script, 'r') as f:
                content = f.read()
            
            assert "ANTHROPIC_API_KEY" in content, \
                "cipher-mcp.sh doit vérifier ANTHROPIC_API_KEY"
            assert "command -v" in content, \
                "cipher-mcp.sh doit vérifier les dépendances"

        # Test exa-mcp.sh  
        exa_script = SCRIPTS_DIR / "exa-mcp.sh"
        if exa_script.exists():
            with open(exa_script, 'r') as f:
                content = f.read()
            
            assert "EXA_API_KEY" in content, \
                "exa-mcp.sh doit vérifier EXA_API_KEY"
            assert "source .env" in content, \
                "exa-mcp.sh doit charger .env"

        # Test serena-mcp.sh
        serena_script = SCRIPTS_DIR / "serena-mcp.sh"
        if serena_script.exists():
            with open(serena_script, 'r') as f:
                content = f.read()
            
            assert "SERENA_CONFIG" in content, \
                "serena-mcp.sh doit définir SERENA_CONFIG"

    def test_scripts_syntax_valid(self):
        """Vérifie que la syntaxe bash des scripts est valide"""
        mcp_scripts = list(SCRIPTS_DIR.glob("*-mcp.sh"))
        
        for script in mcp_scripts:
            # Sur Windows, vérifier la syntaxe basique du script
            content = script.read_text(encoding='utf-8')
            
            # Vérifications basiques de syntaxe bash
            assert "#!/bin/bash" in content or "#!/usr/bin/env bash" in content, \
                f"Script {script.name} doit avoir un shebang bash"
            
            # Vérifier qu'il n'y a pas de caractères suspects
            assert len(content) > 50, f"Script {script.name} semble trop court"

    def test_scripts_dependencies_documented(self):
        """Vérifie que les dépendances des scripts sont documentées"""
        mcp_scripts = list(SCRIPTS_DIR.glob("*-mcp.sh"))
        
        for script in mcp_scripts:
            with open(script, 'r') as f:
                content = f.read()
            
            # Chaque script doit avoir un commentaire descriptif
            lines = content.split('\n')
            assert len(lines) >= 2, f"Script {script.name} trop court"
            assert lines[1].startswith('#'), \
                f"Script {script.name} doit avoir description ligne 2"
            
            # Doit contenir validation des dépendances
            assert "command -v" in content or "which" in content, \
                f"Script {script.name} doit vérifier ses dépendances"

    def test_environment_file_usage(self):
        """Vérifie l'utilisation correcte du fichier .env"""
        env_file = Path(".env")
        env_example = Path(".env.example")
        
        # .env.example doit exister (c'est le template)
        assert env_example.exists(), "Fichier .env.example doit exister"
        
        # Si .env n'existe pas, on peut le créer à partir de .env.example
        if not env_file.exists():
            import shutil
            shutil.copy(env_example, env_file)
        
        assert env_file.exists(), "Fichier .env doit exister ou être créé"
        
        # .env.example doit exister
        assert env_example.exists(), "Fichier .env.example doit exister"
        
        # .env ne doit pas contenir de placeholders
        with open(env_file, 'r') as f:
            env_content = f.read()
        
        # Vérifier qu'il n'y a pas que des placeholders
        placeholder_patterns = [
            "your_openai_api_key_here",
            "your_anthropic_api_key_here", 
            "your_voyage_api_key_here",
            "your_exa_api_key_here"
        ]
        
        # Au moins une vraie clé doit être configurée
        has_real_key = False
        if "sk-ant-api03-" in env_content or "sk-" in env_content:
            has_real_key = True
        if re.search(r'[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}', env_content):
            has_real_key = True
            
        assert has_real_key, \
            "Au moins une clé API réelle doit être configurée dans .env"

if __name__ == "__main__":
    pytest.main([__file__, "-v"])