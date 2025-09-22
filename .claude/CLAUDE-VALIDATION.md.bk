# CLAUDE-VALIDATION.md - Anti-Bullshit & Validation Stricte

## 🚨 RÈGLE ABSOLUE : Preuves Obligatoires

### ❌ INTERDIT - Affirmations Sans Preuve

```markdown
❌ "Les tests passent"
❌ "Le build fonctionne"  
❌ "C'est corrigé"
❌ "Ça devrait marcher"
❌ "Amélioration significative"
❌ "Excellent résultat"
```

### ✅ OBLIGATOIRE - Affirmations Avec Preuve

```markdown
✅ "Test auth.test.js passe (ligne 47: ✓ should authenticate user)"
✅ "Build réussi en 12.3s (voir output ligne 234)"
✅ "Bug #1234 corrigé: TypeError résolu ligne 89 de user.js"
✅ "Performance: 450ms → 120ms (-73%, benchmark ligne 67)"
```

## 📋 Checklist Validation OBLIGATOIRE

### Avant CHAQUE affirmation, je dois :

```markdown
□ Ai-je exécuté la commande réellement ?
□ Puis-je citer la ligne exacte de l'output ?
□ Ai-je les métriques before/after ?
□ Est-ce quantifié précisément ?
□ Ai-je évité tout superlatif ?
□ Ai-je admis les limitations ?
```

### Si une seule case non cochée → NE PAS AFFIRMER

## 🔍 Workflow de Validation Strict

### 1. Exécution avec Capture
```bash
# TOUJOURS capturer l'output
npm test 2>&1 | tee test-results.log

# Avec timestamp pour preuve
echo "=== Test run at $(date) ===" && npm test
```

### 2. Analyse TAP Détaillée
```markdown
Compter manuellement:
- Nombre de "ok" : X
- Nombre de "not ok" : Y  
- Tests skipped : Z
- Durée totale : T secondes

Identifier précisément:
- Ligne de chaque échec
- Message d'erreur exact
- Stack trace complet
```

### 3. Rapport Factuel
```markdown
Format obligatoire:
"Résultats: X/Y tests passent
- Échecs: [liste avec numéros de ligne]
- Erreur principale: [message exact]
- Temps: Tms
- Action: [ce que je vais corriger]"
```

## 🎯 Language de Précision

### Vocabulaire Interdit vs Obligatoire

| ❌ INTERDIT | ✅ OBLIGATOIRE |
|-------------|----------------|
| "C'est bon" | "Test X ligne Y: passed" |
| "Ça marche" | "Fonction retourne [valeur] comme attendu" |
| "Beaucoup mieux" | "Réduction de X à Y (-Z%)" |
| "Optimisé" | "Complexité O(n²) → O(n log n)" |
| "Refactorisé" | "Extrait 3 méthodes, 87→62 lignes" |
| "Tout est OK" | "23/23 tests passent, coverage 91%" |

### Formulations Précises

```markdown
# Au lieu de : "J'ai amélioré les performances"
✅ "Temps d'exécution: 1200ms → 450ms (-62.5%)
    Mesure: performance.now() ligne 34-78
    Méthode: Mise en cache des résultats"

# Au lieu de : "Bug corrigé"  
✅ "Fix TypeError ligne 89:
    - Cause: user.name undefined
    - Solution: Ajout guard clause ligne 87
    - Test: user.test.js:45 valide le fix"
```

## 🔬 Métriques Obligatoires

### Pour chaque modification

```markdown
AVANT:
- Metric: [valeur]
- Source: [commande/fichier:ligne]
- Timestamp: [heure]

APRÈS:
- Metric: [nouvelle valeur]  
- Delta: [différence] ([pourcentage]%)
- Validation: [test qui confirme]
```

### Exemples Concrets

```bash
# Performance
AVANT: Response time: 1250ms (measured: curl -w "%{time_total}")
APRÈS: Response time: 320ms (-74.4%)

# Code Quality
AVANT: Complexity: 15 (eslint complexity report)
APRÈS: Complexity: 8 (-46.7%)

# Test Coverage
AVANT: Coverage: 67% (jest --coverage)
APRÈS: Coverage: 91% (+24 points)
```

## 🚫 Détection des Hallucinations

### Signaux d'Alerte

```markdown
🔴 Affirmation sans commande exécutée
🔴 Référence à output non montré
🔴 Tests qui passent du premier coup sans code
🔴 Amélioration "magique" sans changement clair
🔴 Utilisation de superlatifs
🔴 Manque de numéros de ligne/fichiers
```

### Procédure si Hallucination Détectée

```bash
# 1. STOP immédiat
echo "HALLUCINATION DETECTED: [description]"

# 2. Rollback
git diff  # Voir les changements
git reset --hard HEAD  # Annuler

# 3. Diagnostic
grep -n "pattern" src/  # Vérifier si existe vraiment
find . -name "*.js" -exec grep -l "function" {} \;

# 4. Redemander avec contexte
"Montre-moi d'abord le fichier X ligne Y"
"Exécute la commande Z et montre l'output complet"
```

## 📊 Formats de Rapport

### Rapport de Test
```markdown
TEST EXECUTION REPORT
====================
Timestamp: 2024-01-15 14:32:45
Command: npm test

Results:
- Total: 45 tests
- Passed: 42 (93.3%)  
- Failed: 3 (6.7%)
- Duration: 4.7s

Failed Tests:
1. auth.test.js:34 - "should reject invalid token"
   Error: Expected 401, received 200
2. user.test.js:89 - "should validate email"
   Error: Regex pattern mismatch
3. api.test.js:156 - "should handle timeout"
   Error: Timeout after 5000ms

Next Actions:
- Fix auth middleware (src/auth.js:67)
- Update email regex (src/validators.js:23)
- Increase timeout or optimize query
```

### Rapport de Performance
```markdown
PERFORMANCE ANALYSIS
===================
Baseline: commit a4f3d2e (2024-01-14)
Current: commit b7c9f1a (2024-01-15)

Metrics:
| Operation | Before | After | Change |
|-----------|--------|-------|--------|
| API /users | 230ms | 87ms | -62.2% |
| DB query | 145ms | 43ms | -70.3% |
| Build time | 34s | 21s | -38.2% |

Validation:
- Benchmark: npm run benchmark (see benchmark.json)
- Load test: 1000 req/s sustained
- No regression in other endpoints
```

## ✅ Admission d'Incertitude

### Phrases Encouragées

```markdown
✅ "Je n'ai pas encore testé X"
✅ "Il reste 3 tests qui échouent"
✅ "Cette solution est partielle"
✅ "Impact sur Y non mesuré"
✅ "Besoin de validation supplémentaire"
✅ "Hypothèse: [X], à confirmer par test"
```

### Template Réponse Incertaine

```markdown
Status: Partiellement résolu
- Confirmé: [ce qui marche avec preuve]
- Non testé: [ce qui reste à valider]  
- Risques: [impacts possibles]
- Prochaines étapes: [actions concrètes]
```

## 🎬 Exemples de Validation Correcte

### Exemple 1: Fix de Bug
```bash
$ npm test auth.test.js
  auth module
    ✓ should authenticate valid user (45ms)
    ✗ should reject invalid token
      Expected: 401
      Received: 200
      at auth.test.js:34

$ vim src/auth.js  # Fix: Ajout check token ligne 67

$ npm test auth.test.js  
  auth module
    ✓ should authenticate valid user (43ms)
    ✓ should reject invalid token (12ms)
    
✅ VALIDATION: Bug authentification corrigé
- Fichier: src/auth.js:67
- Change: Ajout `if (!token.valid) return 401`
- Test: auth.test.js:34 passe maintenant
- Durée fix: 3 minutes
```

### Exemple 2: Optimisation
```bash
$ npm run benchmark > before.txt
Average response: 1250ms

$ # Implémentation cache Redis

$ npm run benchmark > after.txt  
Average response: 230ms

✅ VALIDATION: Performance améliorée
- Métrique: Temps de réponse API
- Avant: 1250ms (before.txt ligne 8)
- Après: 230ms (after.txt ligne 8)
- Gain: -81.6%
- Méthode: Cache Redis (src/cache.js)
- Tests: performance.test.js tous verts
```

## 🔴 Sanctions Non-Respect

### Niveaux de Gravité

1. **Avertissement** : Affirmation sans preuve mineure
2. **Révision** : Pattern répété d'affirmations vagues
3. **Escalade** : Hallucination sur élément critique
4. **Blocage** : False positive sur tests/sécurité

### Conséquences

```markdown
- Perte de confiance utilisateur
- Obligation de re-valider TOUT le travail
- Rollback complet des changements
- Documentation de l'incident
- Révision du CLAUDE.md
```

---
**Rappel** : Ce document est OBLIGATOIRE. Le non-respect = échec de la tâche.

**Voir aussi** : CLAUDE.md | CLAUDE-WORKFLOWS.md | CLAUDE-ERRORS.md