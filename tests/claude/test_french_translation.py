#!/usr/bin/env python3
"""Tests pour validation de la traduction française."""

import os
import re
import pytest
from pathlib import Path

def test_claude_fr_exists():
    """Vérifier que CLAUDE-FR.md existe et est lisible."""
    fr_file = Path(".claude/CLAUDE-FR.md")
    assert fr_file.exists(), "CLAUDE-FR.md n'existe pas"
    assert fr_file.is_file(), "CLAUDE-FR.md n'est pas un fichier"
    
    content = fr_file.read_text(encoding='utf-8')
    assert len(content) > 1000, "Contenu CLAUDE-FR.md trop court"

def test_french_structure_matches_english():
    """Vérifier que la structure FR correspond à EN."""
    en_file = Path(".claude/CLAUDE.md")
    fr_file = Path(".claude/CLAUDE-FR.md")
    
    en_content = en_file.read_text(encoding='utf-8')
    fr_content = fr_file.read_text(encoding='utf-8')
    
    # Compter les sections principales
    en_sections = len(re.findall(r'^##\s+', en_content, re.MULTILINE))
    fr_sections = len(re.findall(r'^##\s+', fr_content, re.MULTILINE))
    
    assert en_sections == fr_sections, f"Nombre de sections différent: EN={en_sections}, FR={fr_sections}"

def test_code_blocks_preserved():
    """Vérifier que les blocs de code sont préservés."""
    fr_file = Path(".claude/CLAUDE-FR.md")
    content = fr_file.read_text(encoding='utf-8')
    
    # Vérifier présence de commandes bash essentielles
    assert "npm test" in content, "Commande 'npm test' manquante"
    assert "pytest -vv" in content, "Commande 'pytest -vv' manquante"
    assert "git diff" in content, "Commande 'git diff' manquante"
    assert "mcp__serena__list_dir" in content, "Fonction MCP manquante"

def test_emojis_preserved():
    """Vérifier que les emojis sont préservés."""
    fr_file = Path(".claude/CLAUDE-FR.md")
    content = fr_file.read_text(encoding='utf-8')
    
    required_emojis = ["🔴", "🛑", "⚡", "🔐", "🎯", "📁", "🔍", "🚨", "📊", "🔗", "⚠️"]
    for emoji in required_emojis:
        assert emoji in content, f"Emoji {emoji} manquant"

def test_french_terminology():
    """Vérifier l'usage de la terminologie française appropriée."""
    fr_file = Path(".claude/CLAUDE-FR.md")
    content = fr_file.read_text(encoding='utf-8')
    
    # Vérifications positives - ces termes DOIVENT être présents (typographie française corrigée)
    french_terms = [
        "JAMAIS créer sans analyser",
        "TOUJOURS prouver par exécution",
        "arrêt immédiat",
        "Conditions d'arrêt",  # Typographie française corrigée
        "Flux TDD",
        "Points de contrôle"
    ]
    
    for term in french_terms:
        assert term in content, f"Terme français '{term}' manquant"

def test_technical_terms_not_translated():
    """Vérifier que les termes techniques ne sont PAS traduits."""
    fr_file = Path(".claude/CLAUDE-FR.md")
    content = fr_file.read_text(encoding='utf-8')
    
    # Ces termes doivent rester en anglais/technique
    technical_terms = [
        "calculate_elo_delta()",
        "kebab-case",
        "camelCase.js",
        "PascalCase.jsx",
        "settings.local.json",
        "npm test",
        "pytest",
        "git diff"
    ]
    
    for term in technical_terms:
        assert term in content, f"Terme technique '{term}' manquant ou mal traduit"

def test_file_references_updated():
    """Vérifier que les références aux fichiers sont mises à jour."""
    fr_file = Path(".claude/CLAUDE-FR.md")
    content = fr_file.read_text(encoding='utf-8')
    
    # Vérifier références vers versions françaises
    french_refs = [
        "CLAUDE-WORKFLOWS-FR.md",
        "CLAUDE-VALIDATION-FR.md", 
        "CLAUDE-ERRORS-FR.md",
        "CLAUDE-SETTINGS-FR.md"
    ]
    
    for ref in french_refs:
        assert ref in content, f"Référence '{ref}' manquante"

def test_line_count_reasonable():
    """Vérifier que le nombre de lignes est raisonnable (<150)."""
    fr_file = Path(".claude/CLAUDE-FR.md")
    content = fr_file.read_text(encoding='utf-8')
    lines = content.split('\n')
    
    assert len(lines) <= 150, f"Trop de lignes: {len(lines)} > 150"
    assert len(lines) >= 100, f"Trop peu de lignes: {len(lines)} < 100"

def test_markdown_syntax_valid():
    """Vérifier que la syntaxe Markdown est valide."""
    fr_file = Path(".claude/CLAUDE-FR.md")
    content = fr_file.read_text(encoding='utf-8')
    
    # Vérifier structure basique
    assert content.startswith("# CLAUDE-FR.md"), "Titre principal manquant"
    assert "## 🔴 RÈGLES ABSOLUES" in content, "Section règles absolues manquante"
    assert "---" in content, "Séparateur final manquant"
    
    # Vérifier pas de markdown cassé
    assert "```bash" in content, "Blocs code bash manquants"
    assert "```markdown" in content, "Blocs code markdown manquants"

def test_no_english_artifacts():
    """Vérifier qu'il ne reste pas d'artefacts anglais.""" 
    fr_file = Path(".claude/CLAUDE-FR.md")
    content = fr_file.read_text(encoding='utf-8')
    
    # Ces termes ne doivent PAS être présents (sauf dans code)
    english_artifacts = [
        "NEVER create without",
        "ALWAYS prove by execution",
        "Stop Conditions",
        "Workflow TDD", 
        "Checkpoints (security)"
    ]
    
    for artifact in english_artifacts:
        # Vérifier qu'ils ne sont pas dans le texte libre (hors blocs code)
        lines = content.split('\n')
        text_lines = [line for line in lines if not line.strip().startswith('#') and '```' not in line]
        text_content = '\n'.join(text_lines)
        
        assert artifact not in text_content, f"Artefact anglais '{artifact}' trouvé dans le texte"

if __name__ == "__main__":
    # Tests rapides en ligne de commande
    test_claude_fr_exists()
    test_french_structure_matches_english()
    test_code_blocks_preserved()
    test_emojis_preserved()
    test_french_terminology()
    test_technical_terms_not_translated()
    test_file_references_updated()
    test_line_count_reasonable()
    test_markdown_syntax_valid()
    test_no_english_artifacts()
    
    print("✅ Tous les tests de traduction française passent!")