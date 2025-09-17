# Quality Templates - Claude Meta Workspace

## 🎯 Objectif

Templates réutilisables pour système de qualité unifié à travers tous les projets du workspace `C:\dev`.

## 📁 Structure

```
quality-templates/
├── scripts/                    # Templates scripts qualité
│   ├── historical-extractor-template.js
│   ├── serena-guards-template.js
│   └── integration-template.js
├── patterns-database/          # Base de données patterns commune
│   ├── cross-project-patterns.json
│   ├── anti-patterns-catalog.md
│   └── quality-metrics-standards.json
├── automation/                 # Scripts d'automatisation workspace
│   ├── setup-quality-workspace.js
│   └── sync-patterns-across-projects.js
└── README.md                   # Ce fichier
```

## 🚫 **CONTRAINTES DE NON-RÉGRESSION**

⚠️ **IMPORTANT** : Ces templates **COMPLÈTENT** l'écosystème `.claude-meta` existant.

### Existant à Préserver
- ✅ `stack-templates/` - Templates de projets (INTOUCHABLE)
- ✅ `stack-templates-v2/` - Templates v2 (INTOUCHABLE)
- ✅ Tous scripts Python existants (INTOUCHABLE)
- ✅ Configuration workspace actuelle (INTOUCHABLE)

### Nouveauté Ajoutée
- ➕ `quality-templates/` - Templates qualité UNIQUEMENT
- ➕ Patterns database cross-projets
- ➕ Automation qualité workspace-wide

## 🔄 Workflow Integration

### Setup Nouveau Projet
```bash
# 1. Utiliser les templates existants pour structure
cd C:/dev/nouveau-projet/
python ../../../.claude-meta/stack-templates/generate.py --config projet.yml

# 2. Ajouter couche qualité
node ../../../.claude-meta/quality-templates/automation/setup-quality-workspace.js
```

### Maintenance Workspace
```bash
# Sync patterns découverts entre projets
node .claude-meta/quality-templates/automation/sync-patterns-across-projects.js
```

## 🛡️ **Tests de Non-Régression**

Avant tout commit, valider :
1. ✅ Templates stack existants fonctionnels
2. ✅ Scripts Python workspace opérationnels
3. ✅ Nouveaux templates qualité compatibles
4. ✅ Pas de conflit de nommage ou de structure

## 📊 Compatibilité

- **Stack Templates v1/v2** : Compatibilité totale
- **Scripts Python** : Aucun impact
- **Projets existants** : Opt-in seulement
- **Nouveaux projets** : Bénéficient automatiquement

---
*Version* : 1.0
*Compatibilité* : Stack Templates v1/v2
*Non-Regression* : Garantie