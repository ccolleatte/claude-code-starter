# INTEGRATION-PERMISSIONS.md - Guide d'Intégration settings.local.json

## 🎯 Vue d'ensemble

Votre fichier `settings.local.json` est **excellent** et plus sécurisé que ma proposition initiale. 
Voici comment l'intégrer parfaitement avec la nouvelle structure v4.1.

## 📊 Analyse de Votre Configuration Actuelle

### Points Forts de Votre Approche
✅ **Granularité fine** : `git config:*`, `npm test:*` au lieu de wildcards génériques
✅ **Sécurité par défaut** : Whitelist stricte, pas de commandes dangereuses
✅ **Spécifique au projet** : `claude-stack.js` avec permissions dédiées
✅ **Structure allow/deny/ask** : Plus flexible que ma proposition

### Améliorations Suggérées

```json
{
  "permissions": {
    "allow": [
      // VOS PERMISSIONS ACTUELLES (à conserver)
      "Bash(git config:*)",
      "Bash(git fetch:*)",
      "Bash(git push:*)",
      "Bash(git add:*)",
      "Bash(git commit:*)",
      "Bash(npm run typecheck:*)",
      "Bash(npm install)",
      "Bash(npx tsc:*)",
      "Bash(npm run build:*)",
      "Bash(npm test:*)",
      "Bash(node:*)",
      "Bash(tee:*)",
      "Bash(./packages/cli/dist/bin/claude-stack.js --help)",
      "Bash(./packages/cli/dist/bin/claude-stack.js analyze:*)",
      
      // AJOUTS RECOMMANDÉS pour v4.1
      "Bash(git status)",        // Pour validation
      "Bash(git diff:*)",        // Pour vérification avant commit
      "Bash(git log --oneline -10)", // Pour historique
      "Bash(grep -r:*)",         // Pour recherche code
      "Bash(find . -name:*)",    // Pour navigation
      "Bash(ls -la:*)",          // Pour exploration structure
      "Bash(cat:*)",             // Pour lecture fichiers
      "Bash(echo:*)",            // Pour debug
      "Bash(pwd)",               // Pour contexte
      "Edit",                    // Permission d'édition fichiers
      "View"                     // Permission de lecture
    ],
    
    "deny": [
      // SÉCURITÉ CRITIQUE
      "Bash(rm -rf:*)",
      "Bash(sudo:*)",
      "Bash(chmod 777:*)",
      "Bash(curl:*)",            // Éviter téléchargements
      "Bash(wget:*)",
      "Bash(*API_KEY*)",         // Bloquer secrets
      "Bash(*SECRET*)",
      "Bash(*PASSWORD*)"
    ],
    
    "ask": [
      // CONFIRMATION REQUISE
      "Bash(git push --force:*)",
      "Bash(npm publish)",
      "Bash(rm:*)",              // Suppressions
      "Bash(mv:*)"               // Déplacements
    ]
  },
  
  // AJOUTS pour intégration v4.1
  "model": "claude-opus-4-1-20250805",
  "autoAcceptThreshold": "never",
  
  "contextFiles": [
    "CLAUDE.md",
    "CLAUDE-VALIDATION.md",
    "CLAUDE-SETTINGS.md"
  ],
  
  "validation": {
    "requireTests": true,
    "minCoverage": 90,
    "maxFileChanges": 3,
    "maxLinesPerChange": 100
  },
  
  "agents": {
    "useSubagents": true
  }
}
```

## 🔄 Plan d'Intégration

### Étape 1 : Backup Configuration Actuelle
```bash
cp settings.local.json settings.local.json.backup
```

### Étape 2 : Créer Structure .claude/
```bash
mkdir -p .claude
cp settings.local.json .claude/settings.local.json
```

### Étape 3 : Ajouter les Nouveaux Fichiers
```bash
# Copier depuis le ZIP
cp CLAUDE*.md .claude/
```

### Étape 4 : Mise à Jour .gitignore
```bash
echo ".claude/settings.local.json" >> .gitignore
echo ".claude/*.backup" >> .gitignore
```

### Étape 5 : Tester les Permissions
```bash
# Test avec Claude Code
claude --settings .claude/settings.local.json

# Commandes de test
"Exécute: git status"        # ✅ Devrait marcher
"Exécute: rm -rf /"         # ❌ Devrait être bloqué
"Exécute: npm test"          # ✅ Devrait marcher
```

## 📋 Checklist de Compatibilité

### Vos Permissions ↔ CLAUDE.md v4.1

| Règle CLAUDE.md | Votre Permission | Status | Action |
|-----------------|------------------|---------|---------|
| `npm test` après modif | ✅ `npm test:*` | Compatible | - |
| `git diff` avant commit | ❌ Manquant | À ajouter | Ajouter `git diff:*` |
| `git status` validation | ❌ Manquant | À ajouter | Ajouter `git status` |
| `grep` pour recherche | ❌ Manquant | Recommandé | Ajouter `grep -r:*` |
| `pytest` pour Python | ❌ Non applicable | Optionnel | Si Python utilisé |

## 🎯 Configuration Hybride Recommandée

### Structure Finale
```
projet/
├── .claude/
│   ├── settings.json         # Config globale (versionné)
│   ├── settings.local.json   # VOS permissions (non versionné)
│   ├── CLAUDE.md            # Instructions critiques
│   ├── CLAUDE-SETTINGS.md   # Documentation permissions
│   ├── CLAUDE-VALIDATION.md # Anti-hallucination
│   ├── CLAUDE-ERRORS.md     # Patterns erreurs
│   └── CLAUDE-WORKFLOWS.md  # Workflows
```

### settings.json (Global, Versionné)
```json
{
  "model": "claude-opus-4-1-20250805",
  "contextFiles": ["CLAUDE.md", "CLAUDE-VALIDATION.md"],
  "validation": {
    "requireTests": true,
    "minCoverage": 90
  }
}
```

### settings.local.json (Local, Non Versionné)
```json
{
  "permissions": {
    // VOS PERMISSIONS SPÉCIFIQUES
  }
}
```

## 🚨 Points d'Attention

### 1. Permissions Manquantes Critiques
Votre config actuelle manque quelques permissions utiles pour CLAUDE.md v4.1 :

- `git diff:*` - Nécessaire pour validation avant commit
- `git status` - Pour vérifier état
- `grep/find` - Pour navigation code
- `Edit/View` - Permissions de base fichiers

### 2. Commandes Projet-Spécifiques
Excellent d'avoir :
- `./packages/cli/dist/bin/claude-stack.js`

Cela montre une config adaptée à votre projet spécifique.

### 3. Sécurité
Votre approche est plus sécurisée que ma proposition initiale. 
Gardez cette philosophie restrictive.

## ✅ Validation Finale

```bash
# Script de test complet
cat > test-permissions.sh << 'EOF'
#!/bin/bash
echo "Test des permissions Claude Code..."

# Tests qui doivent passer
claude "git status" && echo "✅ git status OK"
claude "npm test" && echo "✅ npm test OK"

# Tests qui doivent échouer
claude "rm -rf /" 2>&1 | grep -q "denied" && echo "✅ rm -rf bloqué"
claude "sudo apt update" 2>&1 | grep -q "denied" && echo "✅ sudo bloqué"

echo "Tests terminés!"
EOF

chmod +x test-permissions.sh
./test-permissions.sh
```

## 📈 Évolution Suggérée

### Semaine 1-2 : Adoption
- Utiliser votre config actuelle + ajouts minimaux
- Logger toutes les commandes
- Noter les refus

### Semaine 3-4 : Optimisation
- Analyser logs
- Ajouter permissions fréquemment demandées
- Affiner deny list

### Mois 2+ : Maturité
- Config stable et optimisée
- Patterns établis
- Documentation complète

---

**Conclusion** : Votre `settings.local.json` est une excellente base. 
L'approche v4.1 le complète avec structure et documentation, sans compromettre la sécurité.

**Action Recommandée** : Gardez votre fichier, ajoutez juste les permissions manquantes critiques 
(git diff, git status, grep) et intégrez avec la nouvelle structure CLAUDE*.md.