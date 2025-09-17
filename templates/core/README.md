# Claude Stack - Architecture Modulaire

## 🎯 Problème résolu

**Avant**: Format JSON hybride avec contenu embarqué
```json
{
  "content": "repos:\n  - repo: https://github.com/..."
}
```

**Après**: Fichiers séparés avec templating
```
.claude-stack/
├── config.yml           # Configuration centralisée
├── templates/           # Templates Jinja2-like
│   ├── mcp-config.json.j2
│   ├── hooks.json.j2
│   └── *.j2
├── generate.py          # Générateur + validation
└── README.md           # Cette doc
```

## 🚀 Utilisation

### Génération des fichiers
```bash
# Génération standard
python .claude-stack/generate.py

# Aperçu sans création
python .claude-stack/generate.py --dry-run

# Validation des fichiers générés
python .claude-stack/generate.py --validate

# Configuration personnalisée
python .claude-stack/generate.py --config my-config.yml
```

### Modification des variables
Éditer `.claude-stack/config.yml`:
```yaml
variables:
  coverage_threshold_lines: 85  # Au lieu de 80
  reports_dir: "reports"
  semgrep_config: "p/security"  # Config plus stricte
```

### Ajout d'un nouveau template
1. Créer `templates/mon-fichier.j2`
2. Ajouter le mapping dans `generate.py`
3. Relancer la génération

## ✅ Avantages

- **✅ Syntaxe validée**: Chaque fichier dans son format natif
- **✅ Maintenance simple**: Variables centralisées
- **✅ Pas d'échappement**: Fini les `\n` dans le JSON
- **✅ Réutilisable**: Templates partageables entre projets
- **✅ Validation**: Détection erreurs avant utilisation

## 🔧 Variables disponibles

| Variable | Valeur par défaut | Usage |
|----------|-------------------|-------|
| `project_root` | `"."` | Racine du projet |
| `reports_dir` | `"reports"` | Dossier des rapports |
| `coverage_threshold_lines` | `80` | Seuil couverture lignes |
| `coverage_threshold_branches` | `70` | Seuil couverture branches |
| `semgrep_config` | `"p/ci"` | Config Semgrep |

## 📂 Templates inclus

- `mcp-config.json.j2` → `.claude/mcp.json`
- `hooks.json.j2` → `.claude/hooks.json`
- `pre-commit-config.yaml.j2` → `.pre-commit-config.yaml`
- `pyproject.toml.j2` → `pyproject.toml`
- `package.json.merge.j2` → (merge manuel requis)

## 🔄 Migration depuis l'ancien format

1. **Backup** du fichier original:
   ```bash
   cp 2025_pile_claude.md 2025_pile_claude.md.backup
   ```

2. **Génération** des nouveaux fichiers:
   ```bash
   python .claude-stack/generate.py
   ```

3. **Validation** de la syntaxe:
   ```bash
   python .claude-stack/generate.py --validate
   ```

4. **Test** des configurations:
   ```bash
   # Tester les hooks Claude
   echo "test" > test.js && claude edit test.js

   # Tester pre-commit
   pre-commit run --all-files
   ```

## 🛡️ Sécurité

- Pas d'exécution de code dans les templates
- Validation syntaxique avant utilisation
- Variables strictement typées
- Pas d'injection de contenu externe

## 🚧 Roadmap

- [ ] Support GitLab CI templates
- [ ] Templates Docker/Kubernetes
- [ ] CLI avec sous-commandes
- [ ] Hot-reload des configurations
- [ ] Integration avec Claude Code