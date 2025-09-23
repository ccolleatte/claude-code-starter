# CLAUDE-VALIDATION-v2.md - Anti-Bullshit + Approche Adaptative

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

<!-- AJOUT v2: Validation adaptée à la complexité -->
## 🎯 Validation Adaptative par Complexité

### Tâches SIMPLES (< 3 étapes)
```markdown
VALIDATION ALLÉGÉE:
□ Commande exécutée réellement ?
□ Output capturé et cité ?
□ Changement isolé et minimal ?

Communication: Preuve concise (1-2 lignes)
Exemple: "Fix appliqué ligne 42, test user.test.js:89 passe"
```

### Tâches COMPLEXES (≥ 3 étapes)
```markdown
VALIDATION RENFORCÉE:
□ Chaque étape exécutée et prouvée ?
□ Métriques before/after documentées ?
□ Impact sur tests existants vérifié ?
□ Architecture/conventions respectées ?
□ Documentation décisions critiques ?

Communication: Rapport détaillé avec sections
```

### Tâches CRITIQUES (impact architectural)
```markdown
VALIDATION EXHAUSTIVE:
□ Tous les points complexes +
□ Validation collaborative obtenue ?
□ Tests d'intégration complets ?
□ Plan de rollback préparé ?
□ Monitoring post-déploiement ?

Communication: Documentation complète + revue
```
<!-- FIN AJOUT v2 -->

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

<!-- AJOUT v2: Métriques adaptatives -->
## 🔬 Métriques Adaptatives

### Tâches Simples - Métriques Minimales
```markdown
OBLIGATOIRE:
- Status: [passed/failed]
- Source: [commande:ligne]
- Temps: [durée]

EXEMPLE:
Status: passed
Source: pytest tests/auth.test.py:45
Temps: 0.3s
```

### Tâches Complexes - Métriques Complètes
```markdown
AVANT:
- Metric: [valeur]
- Source: [commande/fichier:ligne]
- Timestamp: [heure]

APRÈS:
- Metric: [nouvelle valeur]
- Delta: [différence] ([pourcentage]%)
- Validation: [test qui confirme]

EXEMPLE:
AVANT: Response time: 1250ms (curl -w "%{time_total}")
APRÈS: Response time: 320ms (-74.4%)
Validation: performance.test.js:67 confirms < 500ms
```

### Tâches Critiques - Métriques Exhaustives
```markdown
BASELINE METRICS:
- Performance: [avant]
- Security: [scan results]
- Coverage: [%]
- Dependencies: [audit]

POST-CHANGE METRICS:
- Performance: [après] ([delta])
- Security: [new scan]
- Coverage: [nouveau %] ([delta])
- Dependencies: [nouveau audit]
- Regression: [tests passed]

MONITORING:
- Key metrics: [à surveiller]
- Alerts: [seuils critiques]
- Rollback plan: [procédure]
```
<!-- FIN AJOUT v2 -->

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

<!-- AJOUT v2: Templates de rapport adaptatifs -->
## 📊 Templates de Rapport Adaptatifs

### Rapport Tâche Simple
```markdown
SIMPLE TASK REPORT
==================
Task: [description]
Status: [completed/failed]
Command: [command executed]
Result: [1-line outcome]
Time: [duration]

Next: [action si échec, sinon rien]
```

### Rapport Tâche Complexe
```markdown
COMPLEX TASK REPORT
===================
Task: [description]
Timestamp: [start] - [end]
Steps completed: X/Y

Results by Step:
1. [step]: [status] ([duration])
   - Command: [command]
   - Output: [key output lines]
   - Validation: [test/proof]

2. [step]: [status] ([duration])
   - ...

Overall Status: [passed/partial/failed]
Metrics Changed:
- [metric]: [before] → [after] ([delta])

Issues Found:
- [issue 1]: [resolution]
- [issue 2]: [pending]

Next Actions:
- [immediate action]
- [validation needed]
```

### Rapport Tâche Critique
```markdown
CRITICAL TASK REPORT
====================
Task: [description]
Impact Level: [architectural/security/performance]
Timestamp: [start] - [end]
Validation Status: [collaborative review completed]

IMPLEMENTATION PHASES:
Phase 1: Analysis
- Duration: [time]
- Findings: [key discoveries]
- Decisions: [architectural choices]
- Validation: [review/approval]

Phase 2: Implementation
- Steps: X/Y completed
- Tests: [all passed/failed]
- Regressions: [none/list]
- Coverage: [before] → [after]

Phase 3: Validation
- Integration tests: [status]
- Performance tests: [results]
- Security scan: [results]
- User acceptance: [status]

RISK ASSESSMENT:
- High risks: [list]
- Mitigations: [implemented]
- Monitoring: [metrics to watch]
- Rollback: [plan/triggers]

POST-DEPLOYMENT:
- Monitoring plan: [details]
- Success criteria: [metrics]
- Review schedule: [timeline]
```
<!-- FIN AJOUT v2 -->

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

### Exemple 1: Fix de Bug Simple
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

### Exemple 2: Optimisation Complexe
```bash
$ npm run benchmark > before.txt
Average response: 1250ms

$ # Implémentation cache Redis (phase 1-3)

$ npm run benchmark > after.txt
Average response: 230ms

✅ VALIDATION: Performance améliorée
- Métrique: Temps de réponse API
- Avant: 1250ms (before.txt ligne 8)
- Après: 230ms (after.txt ligne 8)
- Gain: -81.6%
- Méthode: Cache Redis (src/cache.js)
- Tests: performance.test.js tous verts
- Régression: Aucune (npm test:all passed)
- Monitoring: Response time < 300ms alerting setup
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