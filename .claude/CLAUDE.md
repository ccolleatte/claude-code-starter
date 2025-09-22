# CLAUDE-v2.md - Instructions Critiques + Workflow Adaptatif

Ce fichier contient les règles critiques ENRICHIES avec workflow intelligent.
Voir aussi : CLAUDE-WORKFLOWS-v2.md | CLAUDE-VALIDATION-v2.md | CLAUDE-ERRORS.md

## 🔴 RÈGLES ABSOLUES (violation = arrêt immédiat)

1. **JAMAIS créer sans analyser** : `mcp__serena__list_dir` OBLIGATOIRE avant création
2. **TOUJOURS prouver par exécution** : Pas d'affirmation sans output réel
3. **JAMAIS modifier main** : Branches feature/* ou fix/* uniquement
4. **Noms de fonctions stricts** : `calculate_elo_delta()` PAS d'autres variantes
5. **Tests avant code** : RED → GREEN → REFACTOR sans exception

<!-- AJOUT v2: Workflow adaptatif par complexité -->
6. **TodoWrite OBLIGATOIRE** : Utiliser exclusivement l'outil intégré Claude Code
7. **Communication graduée** : Adapter la verbosité à la complexité de la tâche
8. **Validation conditionnelle** : Tâches complexes uniquement (≥3 étapes ou impact architectural)
<!-- FIN AJOUT v2 -->

## 🛑 Stop Conditions Automatiques

```markdown
- Test échoue 3x consécutives → STOP et demander aide
- Modification >100 lignes → PAUSE pour validation
- Fonction introuvable → DEMANDER, ne pas créer
- Incertitude sur approche → CLARIFIER avant action
```

<!-- AJOUT v2: Classification automatique des tâches -->
## 🎯 Classification Automatique des Tâches

### Tâches SIMPLES (< 3 étapes)
- **Exécution directe** sans validation préalable
- **Communication concise** (1-2 phrases max)
- **TodoWrite minimal** si nécessaire
- **Exemples** : Fix bug simple, ajout fonction basique, modification config

### Tâches COMPLEXES (≥ 3 étapes OU impact architectural)
- **TodoWrite détaillé** pour planification
- **Validation collaborative** avant implémentation
- **Documentation des décisions** via Cipher ou commentaires code
- **Tests incrémentaux** à chaque étape
- **Exemples** : Nouvelle feature, refactoring majeur, intégration externe

### Triggers de Validation OBLIGATOIRE
- Modifications architecturales
- Changements de conventions établies
- Impact sur multiple projets du workspace
- Nouvelles dépendances ou technologies
<!-- FIN AJOUT v2 -->

## ⚡ Commandes Essentielles

```bash
# Tests (TOUJOURS après modification)
npm test              # Impact analysis - tests affectés seulement
npm test:all          # Suite complète si doute
pytest -vv path/file  # Debug détaillé sur échec

# Validation (AVANT commit)
git diff              # Vérifier changements
npm run ai:review     # Revue automatique IA
git status            # Confirmer fichiers modifiés

# Checkpoints (sécurité)
git add . && git commit -m "checkpoint: before [action]"
git reset --hard HEAD  # Si problème détecté
```

## 🔐 Permissions & Sécurité

Les commandes autorisées sont strictement définies dans `settings.local.json`.
Voir **CLAUDE-SETTINGS.md** pour configuration complète des permissions.

## 🎯 Workflow TDD Strict

```bash
# 1. RED - Test d'abord
echo "Test doit échouer"
pytest tests/new_test.py  # ❌ DOIT échouer

# 2. GREEN - Code minimal
echo "Implémenter JUSTE assez pour passer"
pytest tests/new_test.py  # ✅ DOIT passer

# 3. REFACTOR - Si tous tests verts
echo "Améliorer sans casser"
npm test:all  # ✅ TOUT doit rester vert
```

## 📁 Structure & Conventions OBLIGATOIRES

### Hiérarchie stricte
```
packages/           # Modules monorepo
  └── nom-module/   # kebab-case TOUJOURS
      ├── src/      # Code source
      └── tests/    # Tests du module
src/               # Code principal
  ├── config/      # Configuration
  └── scripts/     # Utilitaires
tests/             # Tests globaux
```

### Nommage obligatoire
- **Dossiers** : `kebab-case` (ex: `tdd-agents-basic/`)
- **Fichiers JS/TS** : `camelCase.js` (ex: `testRunner.js`)
- **Composants** : `PascalCase.jsx` (ex: `Dashboard.jsx`)
- **Tests** : `*.test.js` ou `*.spec.js`

## 🔍 Questions AVANT tout code

1. "Cette fonction existe-t-elle déjà ?" → `grep -r "functionName"`
2. "Quel pattern est utilisé ici ?" → Analyser fichiers similaires
3. "Impact sur tests existants ?" → `npm test` avant/après
4. "Ai-je la structure à jour ?" → `mcp__serena__list_dir`

<!-- AJOUT v2: Excellence technique toujours appliquée -->
## 🏗️ Excellence Technique (toujours)

- **Cause racine** : Identifier et traiter la source du problème
- **Solutions durables** : Éviter patches temporaires
- **Impact minimal** : Préserver stabilité du code existant
- **Simplicité élégante** : Éviter sur-ingénierie

### Communication graduée par complexité
```
Tâche triviale    → Réponse directe (1 ligne)
Tâche standard    → Explication concise (2-3 lignes)
Tâche complexe    → Documentation détaillée + validation
Tâche critique    → Plan complet + revue collaborative
```
<!-- FIN AJOUT v2 -->

## 🚨 Procédure Erreur/Hallucination

```bash
# 1. Détection
git diff                    # Identifier changement suspect
pytest tests/ --tb=short   # Localiser échec précis

# 2. Récupération
git reset --hard HEAD      # Annuler si nécessaire
git stash                  # Ou sauvegarder pour analyse

# 3. Correction
# Reformuler avec exemple CONCRET du comportement attendu
# Citer le code existant qui marche comme référence
```

## 📊 Métriques de Confiance

- **Tests qui passent au 1er coup** : Suspect, vérifier le test
- **Création fichiers non demandés** : 0 toléré, rollback immédiat
- **Suggestions >50 lignes** : Découper obligatoirement
- **Coverage <90%** : Ne pas merger
- **Modification sans test** : Interdit

## 🔗 Références Critiques

- **Workflows détaillés** : voir `CLAUDE-WORKFLOWS-v2.md`
- **Validation & anti-BS** : voir `CLAUDE-VALIDATION-v2.md`
- **Erreurs courantes** : voir `CLAUDE-ERRORS.md`
- **Architecture** : voir `docs/architecture-decisions.md`

## ⚠️ Environnement Requis

```bash
# Setup automatique
npm run setup:quick      # Configuration initiale
npm run setup:validate   # Vérification complète

# Clés API requises (.env)
ANTHROPIC_API_KEY="your-key"  # Cipher + Claude
VOYAGE_API_KEY="your-key"     # Embeddings Cipher
OPENAI_API_KEY="your-key"     # Tests & développement
EXA_API_KEY="your-key"        # Recherche web (optionnel)

# Validation
npm run check:env             # Vérifier clés API
npm test                      # 128 tests doivent passer
```

## 🔧 Configuration MCP Autonome

Le kit utilise maintenant une configuration MCP **autonome** :

```json
// .claude/mcp.json (configuré automatiquement)
{
  "mcpServers": {
    "serena": { "command": "bash", "args": [".claude/scripts/serena-mcp.sh"] },
    "cipher": { "command": "bash", "args": [".claude/scripts/cipher-mcp.sh"] },
    "semgrep": { "command": "bash", "args": [".claude/scripts/semgrep-mcp.sh"] },
    "exa": { "command": "bash", "args": [".claude/scripts/exa-mcp.sh"] }
  }
}
```

---
**Version** : 4.2.0 | **Focus** : Critiques + Workflow Adaptatif | **Lignes** : <180