#!/usr/bin/env python3
"""
Claude Stack Generator - Résout le problème de format incohérent
Génère les fichiers de configuration à partir de templates et variables
"""

import sys
import json
import yaml
from pathlib import Path
from typing import Dict, Any
import argparse

def load_config(config_path: str) -> Dict[str, Any]:
    """Charge la configuration depuis le fichier YAML"""
    with open(config_path, 'r', encoding='utf-8') as f:
        return yaml.safe_load(f)

def simple_template_render(template_content: str, variables: Dict[str, Any]) -> str:
    """
    Système de templating simple - remplace {{ variable }} par sa valeur
    Alternative légère à Jinja2 pour éviter les dépendances
    """
    result = template_content

    def replace_vars(content: str, vars_dict: Dict[str, Any], prefix: str = "") -> str:
        for key, value in vars_dict.items():
            var_name = f"{prefix}.{key}" if prefix else key
            placeholder = "{{ " + var_name + " }}"

            if isinstance(value, dict):
                content = replace_vars(content, value, var_name)
            elif isinstance(value, list):
                # Conversion liste en format JSON pour les templates
                content = content.replace(placeholder, json.dumps(value))
            else:
                content = content.replace(placeholder, str(value))

        return content

    return replace_vars(result, variables)

def generate_file(template_path: Path, output_path: Path, variables: Dict[str, Any]) -> bool:
    """Génère un fichier depuis un template"""
    try:
        with open(template_path, 'r', encoding='utf-8') as f:
            template_content = f.read()

        rendered_content = simple_template_render(template_content, variables)

        # Créer le répertoire parent si nécessaire
        output_path.parent.mkdir(parents=True, exist_ok=True)

        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(rendered_content)

        print(f"[OK] Genere: {output_path}")
        return True

    except Exception as e:
        print(f"[ERROR] Erreur generation {output_path}: {e}")
        return False

def validate_yaml(file_path: Path) -> bool:
    """Valide la syntaxe YAML"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            yaml.safe_load(f)
        return True
    except Exception as e:
        print(f"[ERROR] YAML invalide {file_path}: {e}")
        return False

def validate_json(file_path: Path) -> bool:
    """Valide la syntaxe JSON"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            json.load(f)
        return True
    except Exception as e:
        print(f"[ERROR] JSON invalide {file_path}: {e}")
        return False

def main():
    parser = argparse.ArgumentParser(description='Claude Stack Generator')
    parser.add_argument('--config', default='.claude-stack/config.yml',
                       help='Chemin vers le fichier de configuration')
    parser.add_argument('--validate', action='store_true',
                       help='Valider uniquement les fichiers générés')
    parser.add_argument('--dry-run', action='store_true',
                       help='Afficher ce qui serait généré sans créer les fichiers')

    args = parser.parse_args()

    config_path = Path(args.config)
    if not config_path.exists():
        print(f"[ERROR] Configuration non trouvee: {config_path}")
        sys.exit(1)

    config = load_config(config_path)
    variables = config.get('variables', {})

    # Ajouter les variables de configuration globales
    variables.update({
        'coverage_threshold_lines': config.get('variables', {}).get('coverage_threshold_lines', 80),
        'coverage_threshold_branches': config.get('variables', {}).get('coverage_threshold_branches', 70),
        'reports_dir': config.get('variables', {}).get('reports_dir', 'reports'),
        'semgrep_config': config.get('variables', {}).get('semgrep_config', 'p/ci'),
        'sbom_format': config.get('variables', {}).get('sbom_format', 'cyclonedx-json'),
        'opa_policy_dir': config.get('variables', {}).get('opa_policy_dir', 'policy'),
        'project_root': config.get('variables', {}).get('project_root', '.')
    })

    templates_dir = config_path.parent / "templates"

    # Mapping template -> fichier de sortie
    file_mappings = {
        "mcp-config.json.j2": ".claude/mcp.json",
        "hooks.json.j2": ".claude/hooks.json",
        "pre-commit-config.yaml.j2": ".pre-commit-config.yaml",
        "pyproject.toml.j2": "pyproject.toml",
        # package.json.merge.j2 nécessite une logique spéciale de merge
    }

    success_count = 0
    total_count = len(file_mappings)

    if args.dry_run:
        print("[DRY-RUN] Fichiers qui seraient generes:")
        for template, output in file_mappings.items():
            print(f"  {template} -> {output}")
        return

    if args.validate:
        print("[VALIDATE] Validation des fichiers generes...")
        for output_file in file_mappings.values():
            output_path = Path(output_file)
            if output_path.exists():
                if output_path.suffix in ['.yml', '.yaml']:
                    if validate_yaml(output_path):
                        print(f"[OK] {output_path}")
                        success_count += 1
                elif output_path.suffix == '.json':
                    if validate_json(output_path):
                        print(f"[OK] {output_path}")
                        success_count += 1
                else:
                    print(f"[INFO] {output_path} (pas de validation)")
                    success_count += 1
            else:
                print(f"[WARN] {output_path} n'existe pas")

        print(f"\n[RESULT] Validation: {success_count}/{total_count} fichiers valides")
        return

    print("[GENERATE] Generation des fichiers de configuration...")

    for template_name, output_file in file_mappings.items():
        template_path = templates_dir / template_name
        output_path = Path(output_file)

        if template_path.exists():
            if generate_file(template_path, output_path, variables):
                success_count += 1
        else:
            print(f"[WARN] Template non trouve: {template_path}")

    # Cas spécial pour package.json (merge requis)
    package_template = templates_dir / "package.json.merge.j2"
    if package_template.exists():
        print("[INFO] package.json necessite un merge manuel avec l'existant")

    print(f"\n[RESULT] Generation terminee: {success_count}/{total_count} fichiers")

    if success_count == total_count:
        print("[SUCCESS] Tous les fichiers ont ete generes avec succes!")
        print("\n[NEXT] Prochaines etapes:")
        print("  1. Verifier les fichiers generes")
        print("  2. Merger package.json manuellement si necessaire")
        print("  3. Lancer: python .claude-stack/generate.py --validate")
    else:
        print("[ERROR] Certains fichiers n'ont pas pu etre generes")
        sys.exit(1)

if __name__ == "__main__":
    main()