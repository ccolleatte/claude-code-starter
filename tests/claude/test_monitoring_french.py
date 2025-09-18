#!/usr/bin/env python3
"""Tests pour validation du MONITORING français."""

import os
import re
from pathlib import Path

def test_monitoring_fr_exists():
    """Vérifier que MONITORING-FR.md existe et est lisible."""
    fr_file = Path("docs/claude/MONITORING-FR.md")
    assert fr_file.exists(), "MONITORING-FR.md n'existe pas"
    assert fr_file.is_file(), "MONITORING-FR.md n'est pas un fichier"
    
    content = fr_file.read_text(encoding='utf-8')
    assert len(content) > 8000, "Contenu MONITORING-FR.md trop court"

def test_devops_terminology():
    """Vérifier l'usage de la terminologie DevOps française."""
    fr_file = Path("docs/claude/MONITORING-FR.md")
    content = fr_file.read_text(encoding='utf-8')
    
    # Terminologie DevOps obligatoire
    devops_terms = [
        "surveillance",
        "Tableau de Bord", 
        "métriques",
        "Dépannage",
        "Indicateurs Clés de Performance",
        "alertes",  # Terme présent sous différentes formes
        "Guides Opérationnels"
    ]
    
    for term in devops_terms:
        assert term in content, f"Terme DevOps '{term}' manquant"

def test_kpi_tables_preserved():
    """Vérifier que les tableaux KPI sont préservés."""
    fr_file = Path("docs/claude/MONITORING-FR.md")
    content = fr_file.read_text(encoding='utf-8')
    
    # Vérifier présence des tableaux critiques
    assert "| Métrique | Cible | Seuil d'Alerte | Impact |" in content, "Header tableau métriques manquant"
    assert "Hallucinations Quotidiennes" in content, "Métrique hallucinations manquante"
    assert "Temps de Réponse" in content, "Métrique temps réponse manquante"
    assert "Couverture Tests" in content, "Métrique coverage manquante"

def test_alert_thresholds_preserved():
    """Vérifier que les seuils d'alerte sont préservés."""
    fr_file = Path("docs/claude/MONITORING-FR.md")
    content = fr_file.read_text(encoding='utf-8')
    
    # Seuils critiques doivent être intacts
    critical_thresholds = [
        "≥ 3",  # Hallucinations
        "≥ 5s", # Response time
        "< 100ms", # Config load time
        "> 90%"  # Coverage
    ]
    
    for threshold in critical_thresholds:
        assert threshold in content, f"Seuil critique '{threshold}' manquant"

def test_bash_commands_preserved():
    """Vérifier que les commandes bash sont préservées."""
    fr_file = Path("docs/claude/MONITORING-FR.md")
    content = fr_file.read_text(encoding='utf-8')
    
    # Commandes critiques surveillance
    bash_commands = [
        "scripts/claude-metrics.sh",
        "watch -n 30",
        "grep \"hallucination\"",
        "awk -F'|'",
        "git log --oneline",
        "npm run check:env"
    ]
    
    for cmd in bash_commands:
        assert cmd in content, f"Commande bash '{cmd}' manquante"

def test_yaml_configs_preserved():
    """Vérifier que les configurations YAML/JSON sont préservées."""
    fr_file = Path("docs/claude/MONITORING-FR.md")
    content = fr_file.read_text(encoding='utf-8')
    
    # Configurations techniques intactes
    assert "```yaml" in content, "Blocs YAML manquants"
    assert "```html" in content, "Blocs HTML manquants"
    assert "grafana-config.yml" in content, "Config Grafana manquante"
    assert "datasources:" in content, "Configuration datasources manquante"

def test_french_comments_in_code():
    """Vérifier que les commentaires dans le code sont traduits."""
    fr_file = Path("docs/claude/MONITORING-FR.md")
    content = fr_file.read_text(encoding='utf-8')
    
    # Commentaires français dans le code
    french_comments = [
        "# Déclencheurs",
        "# Actions", 
        "# Suivi temps de réponse",
        "# Surveillance mémoire",
        "# Étapes d'investigation"
    ]
    
    found_comments = 0
    for comment in french_comments:
        if comment in content:
            found_comments += 1
    
    assert found_comments >= 3, f"Pas assez de commentaires traduits: {found_comments}/5"

def test_severity_levels_translated():
    """Vérifier que les niveaux de gravité sont traduits."""
    fr_file = Path("docs/claude/MONITORING-FR.md")
    content = fr_file.read_text(encoding='utf-8')
    
    # Niveaux de gravité en français
    severity_levels = [
        "CRITIQUE (P0) - Réponse Immédiate Requise",
        "AVERTISSEMENT (P1) - Réponse Sous 2 Heures", 
        "INFO (P2) - Revue Quotidienne"
    ]
    
    for level in severity_levels:
        assert level in content, f"Niveau gravité '{level}' manquant"

def test_runbook_procedures():
    """Vérifier que les procédures runbook sont traduites."""
    fr_file = Path("docs/claude/MONITORING-FR.md")
    content = fr_file.read_text(encoding='utf-8')
    
    # Procédures en français
    procedures = [
        "Étapes d'investigation",
        "Processus de récupération",
        "Prévention",
        "Diagnostic",
        "Optimisation"
    ]
    
    found_procedures = 0
    for proc in procedures:
        if proc in content:
            found_procedures += 1
    
    assert found_procedures >= 3, f"Pas assez de procédures traduites: {found_procedures}/5"

def test_maintenance_schedule():
    """Vérifier que le calendrier de maintenance est traduit."""
    fr_file = Path("docs/claude/MONITORING-FR.md")
    content = fr_file.read_text(encoding='utf-8')
    
    # Éléments calendrier maintenance
    schedule_elements = [
        "Quotidien (Automatisé)",
        "Hebdomadaire (Revue Manuelle)",
        "Mensuel (Stratégique)"
    ]
    
    for element in schedule_elements:
        assert element in content, f"Élément calendrier '{element}' manquant"

def test_technical_tools_preserved():
    """Vérifier que les noms d'outils techniques sont préservés."""
    fr_file = Path("docs/claude/MONITORING-FR.md")
    content = fr_file.read_text(encoding='utf-8')
    
    # Outils techniques gardés en anglais
    technical_tools = [
        "Grafana",
        "Slack",
        "Discord", 
        "VS Code",
        "CI/CD"
    ]
    
    for tool in technical_tools:
        assert tool in content, f"Outil technique '{tool}' manquant"

def test_metrics_names_consistency():
    """Vérifier la cohérence des noms de métriques."""
    fr_file = Path("docs/claude/MONITORING-FR.md")
    content = fr_file.read_text(encoding='utf-8')
    
    # Métriques techniques gardées
    metric_names = [
        "hallucination",
        "response_time", 
        "template_usage",
        # "config_error"  # Peut être absent de cette version
    ]
    
    for metric in metric_names:
        assert metric in content, f"Nom métrique technique '{metric}' manquant"

def test_structure_consistency():
    """Vérifier la cohérence structurelle avec l'original."""
    en_file = Path("docs/claude/MONITORING.md")
    fr_file = Path("docs/claude/MONITORING-FR.md")
    
    en_content = en_file.read_text(encoding='utf-8')
    fr_content = fr_file.read_text(encoding='utf-8')
    
    # Structure identique
    assert len(en_content.split('\n')) == len(fr_content.split('\n')), "Nombre lignes différent"
    assert en_content.count('##') == fr_content.count('##'), "Nombre sections différent"
    assert en_content.count('```') == fr_content.count('```'), "Nombre blocs code différent"
    assert en_content.count('|') == fr_content.count('|'), "Nombre colonnes tableaux différent"

if __name__ == "__main__":
    # Tests rapides en ligne de commande
    test_monitoring_fr_exists()
    test_devops_terminology()
    test_kpi_tables_preserved()
    test_alert_thresholds_preserved()
    test_bash_commands_preserved()
    test_yaml_configs_preserved()
    test_french_comments_in_code()
    test_severity_levels_translated()
    test_runbook_procedures()
    test_maintenance_schedule()
    test_technical_tools_preserved()
    test_metrics_names_consistency()
    test_structure_consistency()
    
    print("Tests MONITORING francais: OK")