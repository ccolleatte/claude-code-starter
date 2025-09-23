# CLAUDE-FR.md - Instructions Critiques + Workflow Adaptatif

Ce fichier contient les règles critiques ENRICHIES avec workflow intelligent.
Voir aussi : CLAUDE-WORKFLOWS-FR.md | CLAUDE-VALIDATION-FR.md | CLAUDE-ERRORS-FR.md

## 🔴 RÈGLES ABSOLUES (violation = arrêt immédiat)

1. **JAMAIS créer sans analyser** : `mcp__serena__list_dir` OBLIGATOIRE avant création
2. **TOUJOURS prouver par exécution** : Pas d'affirmation sans output réel
3. **JAMAIS modifier main** : Branches feature/* ou fix/* uniquement
4. **Noms de fonctions stricts** : `calculate_elo_delta()` PAS d'autres variantes
5. **Tests avant code** : RED → GREEN → REFACTOR sans exception
6. **TodoWrite OBLIGATOIRE** : Utiliser exclusivement l'outil intégré Claude Code
7. **Communication graduée** : Adapter la verbosité à la complexité de la tâche
8. **Validation conditionnelle** : Tâches complexes uniquement (≥3 étapes ou impact architectural)

## 🛑 Conditions d'arrêt automatiques

```markdown
- Test échoue 3x consécutives → STOP et demander aide
- Modification >100 lignes → PAUSE pour validation
- Fonction introuvable → DEMANDER, ne pas créer
- Incertitude sur approche → CLARIFIER avant action
```

## 🎯 Classification Automatique des Tâches

**Tâches SIMPLES (< 3 étapes)** : Exécution directe, communication concise, TodoWrite minimal
**Tâches COMPLEXES (≥ 3 étapes)** : TodoWrite détaillé, validation collaborative, tests incrémentaux

**Triggers de Validation OBLIGATOIRE** : Modifications architecturales, changements conventions, impact multi-projets, nouvelles dépendances

## ⚡ Commandes Essentielles

```bash
# Tests (TOUJOURS après modification)
npm test              # Impact analysis - tests affectés seulement
npm test:all          # Suite complète si doute
pytest -vv path/file  # Debug détaillé sur échec

# Validation (AVANT commit)
git diff              # Vérifier changements
git status            # Confirmer fichiers modifiés

# Points de contrôle (sécurité)
git add . && git commit -m "checkpoint: before [action]"
git reset --hard HEAD  # Si problème détecté
```

## 🔐 Sécurité & Permissions

Les commandes autorisées sont strictement définies dans `settings.local.json`.
Voir **CLAUDE-SETTINGS-FR.md** pour configuration complète des permissions.

## 🎯 Flux TDD strict

```bash
# 1. RED - Test d'abord
pytest tests/new_test.py  # ❌ DOIT échouer

# 2. GREEN - Code minimal
pytest tests/new_test.py  # ✅ DOIT passer

# 3. REFACTOR - Si tous tests verts
npm test:all  # ✅ TOUT doit rester vert
```

## 📁 Structure & Conventions OBLIGATOIRES

```
packages/nom-module/    # kebab-case TOUJOURS
  ├── src/             # Code source
  └── tests/           # Tests du module
src/                   # Code principal
```

**Nommage** : Dossiers `kebab-case`, Fichiers JS/TS `camelCase.js`, Composants `PascalCase.jsx`, Tests `*.test.js`

## 🏗️ Excellence Technique (toujours)

- **Cause racine** : Identifier et traiter la source du problème
- **Solutions durables** : Éviter patches temporaires
- **Impact minimal** : Préserver stabilité du code existant
- **Simplicité élégante** : Éviter sur-ingénierie

**Communication graduée** : Triviale → 1 ligne | Standard → 2-3 lignes | Complexe → Documentation + validation | Critique → Plan complet + revue

## 🔍 Questions AVANT tout code

1. "Cette fonction existe-t-elle déjà ?" → `grep -r "functionName"`
2. "Quel pattern est utilisé ici ?" → Analyser fichiers similaires
3. "Impact sur tests existants ?" → `npm test` avant/après
4. "Ai-je la structure à jour ?" → `mcp__serena__list_dir`

## 🚨 Procédure Erreur/Hallucination

```bash
# 1. Détection
git diff                    # Identifier changement suspect
pytest tests/ --tb=short   # Localiser échec précis

# 2. Récupération
git reset --hard HEAD      # Annuler si nécessaire
git stash                  # Ou sauvegarder pour analyse
```

## 📊 Métriques de Confiance

- **Tests qui passent au 1er coup** : Suspect, vérifier le test
- **Création fichiers non demandés** : 0 toléré, rollback immédiat
- **Suggestions >50 lignes** : Découper obligatoirement
- **Coverage <90%** : Ne pas merger
- **Modification sans test** : Interdit

## 🔗 Références Critiques

- **Workflows détaillés** : voir `CLAUDE-WORKFLOWS-FR.md`
- **Validation & anti-BS** : voir `CLAUDE-VALIDATION-FR.md`
- **Erreurs courantes** : voir `CLAUDE-ERRORS-FR.md`

## ⚠️ Environnement Requis

```bash
# Clés API requises (.env)
ANTHROPIC_API_KEY="your-key"  # Cipher + Claude
VOYAGE_API_KEY="your-key"     # Embeddings Cipher
OPENAI_API_KEY="your-key"     # Tests & développement

# Validation
npm run check:env             # Vérifier clés API
npm test                      # Tests doivent passer
```

## 🔧 Configuration MCP Autonome

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
**Version** : 4.2.0 | **Focus** : Critiques + Workflow Adaptatif | **Lignes** : <150