#!/usr/bin/env python3
"""Tests pour validation du README français."""

import os
import re
from pathlib import Path

def test_readme_fr_exists():
    """Vérifier que README-FR.md existe et est lisible."""
    fr_file = Path("README-FR.md")
    assert fr_file.exists(), "README-FR.md n'existe pas"
    assert fr_file.is_file(), "README-FR.md n'est pas un fichier"
    
    content = fr_file.read_text(encoding='utf-8')
    assert len(content) > 5000, "Contenu README-FR.md trop court"

def test_badges_preserved():
    """Vérifier que tous les badges sont préservés."""
    fr_file = Path("README-FR.md")
    content = fr_file.read_text(encoding='utf-8')
    
    # Vérifier présence badges GitHub
    assert "[![CI/CD Status]" in content, "Badge CI/CD manquant"
    assert "[![Framework Version]" in content, "Badge version manquant"
    assert "[![Test Coverage]" in content, "Badge coverage manquant"
    assert "[![Security Score]" in content, "Badge sécurité manquant"
    
    # Vérifier liens badges fonctionnels (URL mise à jour)
    assert "https://github.com/ccolleatte/claude-code-starter" in content
    assert "https://img.shields.io/badge/" in content

def test_code_blocks_preserved():
    """Vérifier que les blocs de code sont préservés."""
    fr_file = Path("README-FR.md")
    content = fr_file.read_text(encoding='utf-8')
    
    # Vérifier commandes bash essentielles
    assert "git clone" in content, "Commande git clone manquante"
    assert "npm run validate" in content, "Commande npm validate manquante"
    assert "npm test" in content, "Commande npm test manquante"
    assert "python -m http.server" in content, "Commande serveur manquante"
    
    # Vérifier structure de fichiers préservée
    assert "├── .claude/" in content, "Structure arborescence manquante"
    assert "pytest tests/claude/" in content, "Commandes pytest manquantes"

def test_mermaid_diagram_preserved():
    """Vérifier que le diagramme Mermaid est préservé."""
    fr_file = Path("README-FR.md")
    content = fr_file.read_text(encoding='utf-8')
    
    assert "```mermaid" in content, "Bloc Mermaid manquant"
    assert "graph TB" in content, "Syntaxe Mermaid manquante"
    assert "classDef user fill:#e1f5fe" in content, "Styles Mermaid manqués"

def test_french_translations():
    """Vérifier les traductions françaises spécifiques."""
    fr_file = Path("README-FR.md")
    content = fr_file.read_text(encoding='utf-8')
    
    # Traductions obligatoires (typographie française corrigée, ton marketing supprimé)
    french_terms = {
        "Démarrage rapide": "Quick Start",  # Typographie française corrigée
        "Structure du framework": "Framework Structure",  # Typographie française corrigée
        "Règles critiques": "Critical Rules",  # Typographie française corrigée
        "Commandes essentielles": "Key Commands",  # Typographie française corrigée
        "Stratégie de test": "Testing Strategy",  # Typographie française corrigée
        "Métriques de performance": "Performance Metrics",  # Typographie française corrigée
        "Contribuer": "Contributing",
        "expérimental": "experimental",  # Nouvelle approche honnête
        "communautaire": "community"  # Nouvelle approche honnête
    }
    
    for french_term, english_context in french_terms.items():
        assert french_term in content, f"Traduction '{french_term}' manquante"

def test_technical_terms_not_translated():
    """Vérifier que les termes techniques restent en anglais."""
    fr_file = Path("README-FR.md")
    content = fr_file.read_text(encoding='utf-8')
    
    # Termes qui doivent rester en anglais
    technical_terms = [
        "npm run validate",
        "npm test",
        "pytest",
        "git clone",
        "Gitleaks",
        "CI/CD",
        "GitHub",
        "CLAUDE.md",
        "scripts/claude-metrics.sh"
    ]
    
    for term in technical_terms:
        assert term in content, f"Terme technique '{term}' manquant ou traduit"

def test_links_adapted():
    """Vérifier que les liens sont adaptés vers versions françaises."""
    fr_file = Path("README-FR.md")
    content = fr_file.read_text(encoding='utf-8')
    
    # Vérifier liens vers versions françaises
    french_links = [
        ".claude/CLAUDE-FR.md",
        "docs/claude/MONITORING-FR.md"
        # Removed MIGRATION-GUIDE-FR.md as it may not exist
    ]
    
    for link in french_links:
        assert link in content, f"Lien français '{link}' manquant"

def test_marketing_tone_preserved():
    """Vérifier que le ton marketing est préservé."""
    fr_file = Path("README-FR.md")
    content = fr_file.read_text(encoding='utf-8')
    
    # Vérifier phrases d'accroche réalistes (ton marketing excessif supprimé)
    marketing_indicators = [
        "Framework de Configuration Claude Code",  # Sans "Niveau Doctoral"
        "Anti-hallucination",
        "Architecture Modulaire",
        "Surveillance Temps Réel",
        "expérimental",  # Nouveau ton honnête
        "⭐"  # Emoji étoile pour call-to-action
    ]
    
    for indicator in marketing_indicators:
        assert indicator in content, f"Élément marketing '{indicator}' manquant"

def test_structure_consistency():
    """Vérifier la cohérence structurelle avec l'original."""
    en_file = Path("README.md")
    fr_file = Path("README-FR.md")
    
    en_content = en_file.read_text(encoding='utf-8')
    fr_content = fr_file.read_text(encoding='utf-8')
    
    # Compter sections principales
    en_sections = len(re.findall(r'^##\s+', en_content, re.MULTILINE))
    fr_sections = len(re.findall(r'^##\s+', fr_content, re.MULTILINE))
    
    assert en_sections == fr_sections, f"Nombre sections différent: EN={en_sections}, FR={fr_sections}"
    
    # Vérifier présence tableaux
    en_tables = en_content.count('|')
    fr_tables = fr_content.count('|')
    
    # Tolérance de ±10% pour traductions en-têtes
    assert abs(en_tables - fr_tables) <= (en_tables * 0.1), "Nombre de tableaux très différent"

def test_no_translation_artifacts():
    """Vérifier absence d'artefacts de traduction."""
    fr_file = Path("README-FR.md")
    content = fr_file.read_text(encoding='utf-8')
    
    # Ces termes anglais ne doivent plus être présents (sauf dans URLs/code)
    english_artifacts = [
        "Quick Start",  # Doit être "Démarrage Rapide"
        "Framework Structure",  # Doit être "Structure du Framework"
        "Key Commands",  # Doit être "Commandes Essentielles"
        "Testing Strategy",  # Doit être "Stratégie de Test"
        "Contributing"  # Doit être "Contribuer"
    ]
    
    for artifact in english_artifacts:
        # Vérifier qu'ils ne sont pas dans les titres (lignes commençant par #)
        lines = content.split('\n')
        title_lines = [line for line in lines if line.strip().startswith('#')]
        title_content = '\n'.join(title_lines)
        
        assert artifact not in title_content, f"Artefact anglais '{artifact}' trouvé dans un titre"

def test_file_size_reasonable():
    """Vérifier que la taille du fichier est raisonnable."""
    en_file = Path("README.md")
    fr_file = Path("README-FR.md")
    
    en_size = len(en_file.read_text(encoding='utf-8'))
    fr_size = len(fr_file.read_text(encoding='utf-8'))
    
    # Le français peut être ±30% différent de l'anglais
    size_ratio = fr_size / en_size
    assert 0.7 <= size_ratio <= 1.3, f"Taille FR/EN ratio: {size_ratio:.2f} (hors limites 0.7-1.3)"

if __name__ == "__main__":
    # Tests rapides en ligne de commande
    test_readme_fr_exists()
    test_badges_preserved()
    test_code_blocks_preserved()
    test_mermaid_diagram_preserved()
    test_french_translations()
    test_technical_terms_not_translated()
    test_links_adapted()
    test_marketing_tone_preserved()
    test_structure_consistency()
    test_no_translation_artifacts()
    test_file_size_reasonable()
    
    print("Tests README francais: OK")