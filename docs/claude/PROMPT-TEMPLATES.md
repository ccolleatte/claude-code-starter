# PROMPT-TEMPLATES.md - Prompts Optimisés pour Claude Code

## 🎯 Principe : Précision > Volume

Plus le prompt est précis et structuré, moins Claude hallucine.

## 📝 Templates par Cas d'Usage

### 1. Démarrage de Session
```markdown
# Prompt optimal
"Analyse la structure du projet avec mcp__serena__list_dir.
Puis lis CLAUDE.md et confirme les règles critiques.
Enfin, exécute npm test pour voir l'état actuel."

# ❌ À éviter
"Regarde le projet et dis-moi ce que tu vois"
```

### 2. Ajout de Fonctionnalité
```markdown
# Prompt optimal
"Je veux ajouter une fonction de validation email.
1. D'abord, vérifie si elle existe: grep -r 'validateEmail' src/
2. Si non, montre-moi où les validateurs sont définis
3. Écris un test qui DOIT échouer pour validateEmail
4. Après mon OK, implémente le minimum pour passer le test"

# ❌ À éviter  
"Ajoute validation email au projet"
```

### 3. Correction de Bug
```markdown
# Prompt optimal
"Bug: TypeError ligne 89 de user.js
1. Montre-moi user.js lignes 85-95
2. Exécute le test qui échoue: npm test user.test.js
3. Identifie la cause exacte
4. Propose un fix minimal
5. Vérifie que tous les tests passent après"

# ❌ À éviter
"Corrige le bug dans user.js"
```

### 4. Refactoring
```markdown
# Prompt optimal
"Refactoring de calculateTotalPrice() dans cart.js:
1. Montre la fonction actuelle
2. Exécute tests actuels: npm test cart.test.js
3. Mesure performance: node --prof cart-benchmark.js
4. Refactorise pour réduire complexité cyclomatique
5. Vérifie: mêmes tests passent + perf améliorée"

# ❌ À éviter
"Améliore calculateTotalPrice"
```

### 5. Tests
```markdown
# Prompt optimal
"Ajoute tests pour le module auth:
1. Liste les fonctions dans auth.js non testées
2. Coverage actuel: npm test -- --coverage auth.js
3. Écris tests pour les 3 fonctions principales
4. Vise 95% coverage, montre le rapport final"

# ❌ À éviter
"Écris des tests pour auth"
```

## 🔍 Patterns de Prompts Efficaces

### Pattern "Explore First"
```markdown
"Avant de [ACTION], montre-moi:
1. Structure actuelle: ls -la [directory]
2. Patterns existants: grep -r '[pattern]' src/
3. Tests associés: find tests/ -name '*[module]*'
Puis propose une approche"
```

### Pattern "Test-Driven"  
```markdown
"Pour implémenter [FEATURE]:
1. Écris d'abord le test (doit échouer)
2. Montre l'échec
3. Implémente le minimum
4. Montre que ça passe
5. Propose refactoring si applicable"
```

### Pattern "Checkpoint"
```markdown
"Tâche complexe [DESCRIPTION]:
1. Git status et commit checkpoint
2. Fais [STEP 1]
3. Teste et montre résultat
4. Si OK, continue [STEP 2]
5. Sinon, rollback et explique"
```

### Pattern "Metrics-Driven"
```markdown
"Optimisation de [FUNCTION]:
1. Mesure actuelle: [METRIC COMMAND]
2. Applique [OPTIMIZATION]
3. Mesure après: [METRIC COMMAND]
4. Compare et quantifie le gain"
```

## 🚨 Formulations Anti-Hallucination

### Pour Éviter les Inventions
```markdown
✅ "Utilise UNIQUEMENT les fonctions existantes"
✅ "Si pas trouvé, DEMANDE au lieu de créer"
✅ "Base-toi sur le pattern dans [file]"
✅ "Ne crée AUCUN nouveau fichier sans confirmation"
```

### Pour Forcer la Validation
```markdown
✅ "Montre l'output complet de la commande"
✅ "Cite le numéro de ligne exact"
✅ "Copie-colle l'erreur exacte"
✅ "Prouve avec le résultat du test"
```

### Pour Limiter la Portée
```markdown
✅ "Modifie SEULEMENT [file]"
✅ "Maximum 50 lignes de changement"
✅ "Une seule fonction à la fois"
✅ "Stop si plus de 3 fichiers impactés"
```

## 🎭 Exemples Avant/Après

### Exemple 1: Analyse de Code
```markdown
❌ AVANT (vague):
"Explique-moi ce code"

✅ APRÈS (précis):
"Dans auth.js, explique:
1. Que fait validateToken() lignes 23-45?
2. Quelles sont ses dépendances?
3. Quels tests la couvrent?"
```

### Exemple 2: Performance
```markdown
❌ AVANT (sans mesure):
"Optimise la fonction de tri"

✅ APRÈS (mesurable):
"Pour sortArray() dans utils.js:
1. Benchmark actuel: node bench/sort.js
2. Identifie le goulot (> O(n log n)?)
3. Optimise l'algo
4. Re-benchmark et compare"
```

### Exemple 3: Création
```markdown
❌ AVANT (trop ouvert):
"Crée un système de cache"

✅ APRÈS (structuré):
"Pour ajouter cache Redis:
1. Vérifie si existe: grep -r 'cache' src/
2. Si non, où mettre? (montre structure)
3. Écris test: get/set/expire
4. Implémente avec redis package
5. Intègre dans api.js ligne 78"
```

## 📊 Métriques de Prompt

### Prompt Efficace Contient:
- [ ] Action spécifique
- [ ] Fichier(s) cible(s)
- [ ] Validation attendue
- [ ] Limites claires
- [ ] Étapes numérotées

### Ratio Idéal:
- 70% instructions
- 20% contexte
- 10% validation

## 🔄 Workflow Multi-Étapes

### Pour Tâches Complexes
```markdown
# Étape 1/4
"Analyse les dépendances de [module]:
- Liste les imports
- Trouve les usages
- Identifie couplages"

# Étape 2/4  
"Maintenant, crée tests pour découplage:
- Test current behavior
- Test après refactor
- Mock les dépendances"

# Étape 3/4
"Applique le refactoring:
- Extrais interface
- Injecte dépendances
- Vérifie tests passent"

# Étape 4/4
"Finalise et valide:
- Lint et format
- Documentation
- Métriques before/after"
```

## 💡 Tips Avancés

### 1. Utiliser les Alias
```bash
# Dans CLAUDE.md, définir:
alias test-quick="npm test -- --maxWorkers=4"
alias test-focus="npm test -- --watch"

# Puis dans prompts:
"Utilise test-quick pour validation rapide"
```

### 2. Conditionner les Actions
```markdown
"SI les tests passent:
  → Continue avec refactoring
SINON:
  → Montre l'erreur et STOP"
```

### 3. Demander Confirmation
```markdown
"Voici mon plan:
1. [action 1]
2. [action 2]
3. [action 3]
Confirme avant que je procède"
```

## 🚫 Prompts à Bannir

```markdown
❌ "Fais de ton mieux"
❌ "Optimise tout"
❌ "Corrige les bugs"
❌ "Améliore le code"
❌ "Rends ça plus rapide"
❌ "Ajoute des features cool"
❌ "Nettoie le projet"
```

## ✅ Checklist Prompt Parfait

Avant d'envoyer, vérifier:
- [ ] Objectif clair et unique
- [ ] Fichiers/fonctions nommés explicitement  
- [ ] Méthode de validation définie
- [ ] Limites et contraintes précisées
- [ ] Étapes ordonnées si > 1 action
- [ ] Exemple ou référence si complexe

---

**Rappel**: Un bon prompt = moins d'hallucinations + résultats prédictibles

**Voir aussi**: CLAUDE.md | CLAUDE-VALIDATION.md | CLAUDE-ERRORS.md