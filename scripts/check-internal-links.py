#!/usr/bin/env python3
"""
Script de validation des liens internes pour les documents français
Vérifie que tous les liens internes pointent vers des fichiers existants
"""
import os
import re
import sys
import argparse
from pathlib import Path

def find_internal_links(content):
    """Trouve tous les liens internes dans le contenu markdown"""
    # Pattern pour les liens markdown [text](file.md) et [text](./file.md)
    markdown_links = re.findall(r'\[([^\]]+)\]\(([^)]+\.md[^)]*)\)', content)
    
    # Pattern pour les références de fichiers comme "voir CLAUDE-FR.md"
    file_refs = re.findall(r'voir\s+([A-Z-]+\.md)', content, re.IGNORECASE)
    
    links = []
    for text, link in markdown_links:
        if not link.startswith('http'):  # Ignore external links
            links.append(link.strip())
    
    for ref in file_refs:
        links.append(ref)
    
    return links

def check_file_links(filepath, lang='fr'):
    """Vérifie les liens d'un fichier spécifique"""
    if not os.path.exists(filepath):
        return False, f"Fichier {filepath} introuvable"
    
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    links = find_internal_links(content)
    broken_links = []
    
    base_dir = os.path.dirname(filepath)
    
    for link in links:
        # Nettoyer le lien (enlever les ancres)
        clean_link = link.split('#')[0]
        
        # Construire le chemin complet
        if clean_link.startswith('./'):
            target_path = os.path.join(base_dir, clean_link[2:])
        elif clean_link.startswith('/'):
            target_path = clean_link[1:]
        else:
            target_path = os.path.join(base_dir, clean_link)
        
        # Normaliser le chemin
        target_path = os.path.normpath(target_path)
        
        if not os.path.exists(target_path):
            broken_links.append(f"{link} -> {target_path}")
    
    return len(broken_links) == 0, broken_links

def main():
    parser = argparse.ArgumentParser(description='Vérifie les liens internes des documents')
    parser.add_argument('--lang', default='fr', help='Langue des documents à vérifier')
    args = parser.parse_args()
    
    # Fichiers français à vérifier
    french_files = [
        '.claude/CLAUDE-FR.md',
        'README-FR.md',
        '.claude/CLAUDE-WORKFLOWS-FR.md',
        'docs/claude/MONITORING-FR.md'
    ]
    
    total_files = 0
    valid_files = 0
    all_issues = []
    
    print(f"=== Validation des liens internes (langue: {args.lang}) ===")
    
    for filepath in french_files:
        if os.path.exists(filepath):
            total_files += 1
            is_valid, issues = check_file_links(filepath, args.lang)
            
            if is_valid:
                valid_files += 1
                print(f"[OK] {filepath}: Liens valides")
            else:
                print(f"[ERREUR] {filepath}: {len(issues)} liens casses")
                for issue in issues:
                    print(f"  - {issue}")
                all_issues.extend(issues)
        else:
            print(f"[WARN] {filepath}: Fichier non trouve")
    
    print(f"\n=== Résumé ===")
    print(f"Fichiers vérifiés: {total_files}")
    print(f"Fichiers valides: {valid_files}")
    print(f"Liens cassés total: {len(all_issues)}")
    
    if all_issues:
        print(f"\n=== Liens à corriger ===")
        for issue in all_issues:
            print(f"- {issue}")
        sys.exit(1)
    else:
        print("[SUCCESS] Tous les liens internes sont valides!")
        sys.exit(0)

if __name__ == '__main__':
    main()