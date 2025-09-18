#!/usr/bin/env python3
"""
Script de validation de la cohérence terminologique pour les documents français
Vérifie l'utilisation cohérente des termes techniques français
"""
import os
import re
import sys
import argparse
import glob
from collections import defaultdict

# Dictionnaire de terminologie technique française standardisée
FRENCH_TERMINOLOGY = {
    # Termes techniques généraux
    'workflow': 'flux de travail',
    'framework': 'framework',  # Anglicisme accepté
    'pipeline': 'pipeline',    # Anglicisme accepté
    'dashboard': 'tableau de bord',
    'monitoring': 'surveillance',
    'testing': 'tests',
    'debugging': 'débogage',
    
    # Termes Claude Code spécifiques
    'hallucination': 'hallucination',
    'prompt': 'prompt',        # Anglicisme accepté
    'agent': 'agent',
    'subagent': 'sous-agent',
    
    # Termes de développement
    'commit': 'commit',        # Anglicisme accepté
    'merge': 'fusion',
    'branch': 'branche',
    'repository': 'dépôt',
    'pull request': 'pull request',  # Anglicisme accepté
    
    # Actions et états
    'failed': 'échoué',
    'success': 'succès',
    'error': 'erreur',
    'warning': 'avertissement',
    'critical': 'critique',
    
    # Structures
    'pattern': 'pattern',      # Anglicisme accepté
    'template': 'modèle',
    'configuration': 'configuration',
    'settings': 'paramètres',
}

# Patterns à détecter (termes anglais qui devraient être traduits)
ENGLISH_PATTERNS = {
    r'\bworkflow\b': 'flux de travail',
    r'\bdashboard\b': 'tableau de bord', 
    r'\bmonitoring\b': 'surveillance',
    r'\btesting\b': 'tests',
    r'\bdebugging\b': 'débogage',
    r'\bmerge\b': 'fusion',
    r'\bbranch\b': 'branche',
    r'\brepository\b': 'dépôt',
    r'\bfailed\b': 'échoué',
    r'\bsuccess\b': 'succès',
    r'\berror\b': 'erreur',
    r'\bwarning\b': 'avertissement',
    r'\bcritical\b': 'critique',
    r'\btemplate\b': 'modèle',
    r'\bsettings\b': 'paramètres',
}

# Termes français requis (doivent apparaître)
REQUIRED_FRENCH_TERMS = [
    'configuration',
    'instructions',
    'règles',
    'validation',
    'structure',
    'sécurité',
    'surveillance',
    'métriques',
    'performance',
    'qualité'
]

def check_terminology_in_file(filepath):
    """Vérifie la terminologie dans un fichier"""
    if not os.path.exists(filepath):
        return False, f"Fichier {filepath} introuvable"
    
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    issues = []
    warnings = []
    
    # Vérifier les termes anglais non traduits (hors blocs de code)
    # Exclure les blocs de code markdown ```
    content_without_code = re.sub(r'```[\s\S]*?```', '', content)
    content_without_inline_code = re.sub(r'`[^`]*`', '', content_without_code)
    
    for pattern, french_term in ENGLISH_PATTERNS.items():
        matches = re.finditer(pattern, content_without_inline_code, re.IGNORECASE)
        for match in matches:
            line_num = content[:match.start()].count('\n') + 1
            issues.append(f"Ligne {line_num}: '{match.group()}' devrait être '{french_term}'")
    
    # Vérifier la présence des termes français requis
    missing_terms = []
    for term in REQUIRED_FRENCH_TERMS:
        if term.lower() not in content.lower():
            missing_terms.append(term)
    
    if missing_terms:
        warnings.append(f"Termes français recommandés manquants: {', '.join(missing_terms)}")
    
    # Vérifier la cohérence des majuscules pour les titres
    title_pattern = r'^#{1,6}\s+(.+)$'
    titles = re.findall(title_pattern, content, re.MULTILINE)
    
    for i, title in enumerate(titles):
        # Les titres devraient commencer par une majuscule (ignorer ceux avec emojis)
        if title and len(title) > 0:
            # Chercher le premier caractère alphabétique
            first_alpha = next((char for char in title if char.isalpha()), None)
            if first_alpha and not first_alpha.isupper():
                warnings.append(f"Ligne ~{i+1}: Titre devrait commencer par une majuscule: '{title[:50]}...'")
    
    return len(issues) == 0, issues + warnings

def analyze_terminology_usage(filepaths):
    """Analyse l'usage global de la terminologie"""
    term_usage = defaultdict(int)
    
    for filepath in filepaths:
        if os.path.exists(filepath):
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read().lower()
                
            for term in REQUIRED_FRENCH_TERMS:
                count = content.count(term.lower())
                term_usage[term] += count
    
    return term_usage

def main():
    parser = argparse.ArgumentParser(description='Vérifie la cohérence terminologique')
    parser.add_argument('--files', default='*-FR.md', help='Pattern des fichiers à vérifier')
    args = parser.parse_args()
    
    # Trouver les fichiers français
    french_files = []
    
    # Chercher dans les patterns spécifiques
    patterns = [
        '.claude/*-FR.md',
        '*-FR.md',
        'docs/**/*-FR.md'
    ]
    
    for pattern in patterns:
        french_files.extend(glob.glob(pattern, recursive=True))
    
    # Dédupliquer
    french_files = list(set(french_files))
    
    if not french_files:
        print("Aucun fichier français trouvé")
        sys.exit(1)
    
    total_files = 0
    valid_files = 0
    all_issues = []
    
    print("=== Validation de la cohérence terminologique ===")
    
    for filepath in sorted(french_files):
        total_files += 1
        is_valid, issues = check_terminology_in_file(filepath)
        
        if is_valid:
            valid_files += 1
            print(f"[OK] {filepath}: Terminologie coherente")
        else:
            print(f"[ERREUR] {filepath}: {len(issues)} problemes detectes")
            for issue in issues:
                print(f"  - {issue}")
            all_issues.extend(issues)
    
    # Analyse globale de l'usage terminologique
    print(f"\n=== Analyse de l'usage terminologique ===")
    term_usage = analyze_terminology_usage(french_files)
    
    for term, count in sorted(term_usage.items(), key=lambda x: x[1], reverse=True):
        if count > 0:
            print(f"[OK] '{term}': {count} occurrences")
        else:
            print(f"[WARN] '{term}': Non utilise")
    
    print(f"\n=== Résumé ===")
    print(f"Fichiers vérifiés: {total_files}")
    print(f"Fichiers conformes: {valid_files}")
    print(f"Problèmes total: {len(all_issues)}")
    
    if all_issues:
        print(f"\n=== Problèmes à corriger ===")
        for issue in all_issues:
            print(f"- {issue}")
        sys.exit(1)
    else:
        print("[SUCCESS] Terminologie coherente dans tous les documents!")
        sys.exit(0)

if __name__ == '__main__':
    main()