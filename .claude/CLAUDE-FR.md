# CLAUDE-FR.md - Instructions Critiques v4.1

Ce fichier contient UNIQUEMENT les règles critiques. 
Voir aussi : CLAUDE-WORKFLOWS-FR.md | CLAUDE-VALIDATION-FR.md | CLAUDE-ERRORS-FR.md

## 🔴 RÈGLES ABSOLUES (violation = arrêt immédiat)

1. **JAMAIS créer sans analyser** : `mcp__serena__list_dir` OBLIGATOIRE avant création
2. **TOUJOURS prouver par exécution** : Pas d'affirmation sans output réel
3. **JAMAIS modifier main** : Branches feature/* ou fix/* uniquement  
4. **Noms de fonctions stricts** : `calculate_elo_delta()` PAS d'autres variantes
5. **Tests avant code** : RED → GREEN → REFACTOR sans exception

## 🛑 Conditions d'Arrêt Automatiques

```markdown
- Test échoue 3x consécutives → STOP et demander de l'aide
- Modification >100 lignes → PAUSE pour validation
- Fonction introuvable → DEMANDER, ne pas créer
- Incertitude sur approche → CLARIFIER avant action
```

## ⚡ Commandes Essentielles

```bash
# Tests (TOUJOURS après modification)
npm test              # Analyse d'impact - tests affectés seulement
npm test:all          # Suite complète si doute
pytest -vv path/file  # Debug détaillé en cas d'échec

# Validation (AVANT commit)
git diff              # Vérifier les changements
npm run ai:review     # Revue automatique par l'IA
git status            # Confirmer les fichiers modifiés

# Points de contrôle (sécurité)
git add . && git commit -m "checkpoint: before [action]"
git reset --hard HEAD  # Si problème détecté
```

## 🔐 Permissions & Sécurité

Les commandes autorisées sont strictement définies dans `settings.local.json`.
Voir **CLAUDE-SETTINGS-FR.md** pour configuration complète des permissions.

## 🎯 Flux TDD Strict

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

- **Tests qui passent au 1er coup** : suspect, vérifier le test
- **Création fichiers non demandés** : 0 toléré, rollback immédiat
- **Suggestions >50 lignes** : découper obligatoirement
- **Coverage <90%** : ne pas merger
- **Modification sans test** : interdit

## 🔗 Références Critiques

- **Flux détaillés** : voir `CLAUDE-WORKFLOWS-FR.md`
- **Validation & anti-BS** : voir `CLAUDE-VALIDATION-FR.md`  
- **Erreurs courantes** : voir `CLAUDE-ERRORS-FR.md`
- **Architecture** : voir `docs/architecture-decisions.md`

## ⚠️ Environnement requis

```bash
# Minimal
export OPENAI_API_KEY="your-key"

# Pour Cipher (mémoire)
export ANTHROPIC_API_KEY="your-key"  
export VOYAGE_API_KEY="your-key"

# Vérifier
npm run check:env
```

---
**Version** : 4.1.0 | **Focus** : Critiques seulement | **Lignes** : <150