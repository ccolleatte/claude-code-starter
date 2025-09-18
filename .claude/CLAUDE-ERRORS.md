# CLAUDE-ERRORS.md - Patterns d'Erreurs & Hallucinations Courantes

## 🚨 Hallucinations Fréquentes à Bloquer

### 1. Invention de Fonctions/Méthodes

#### ❌ Patterns d'Hallucination
```javascript
// HALLUCINATION: Inventer des méthodes
user.calculateScore()  // ❌ N'existe pas
user.getFullDetails()  // ❌ Inventé

// HALLUCINATION: Mauvais nom
calculateElo()        // ❌ Faux nom
calculate_elo_delta()  // ✅ Nom correct
```

#### ✅ Prévention
```bash
# TOUJOURS vérifier l'existence avant usage
grep -r "calculateScore" src/
# Si pas de résultat → NE PAS UTILISER

# Chercher le bon nom
grep -r "calculate.*elo" src/ -i
```

### 2. Création de Fichiers Non Demandés

#### ❌ Patterns d'Hallucination
```markdown
❌ Créer README.md "pour documenter"
❌ Créer config.json "au cas où"
❌ Créer test.js "pour tester rapidement"
❌ Créer backup.js avant modification
```

#### ✅ Prévention
```bash
# AVANT toute création
ls -la src/  # Vérifier structure existante
# Si fichier similaire existe → UTILISER celui-là
# Si vraiment nouveau → DEMANDER confirmation
```

### 3. Imports/Requires Fantaisistes

#### ❌ Patterns d'Hallucination
```javascript
// Import de modules inexistants
import { validate } from './utils'  // ❌ utils n'existe pas
const helper = require('../lib/helper')  // ❌ Chemin inventé

// Import de packages non installés  
import axios from 'axios'  // ❌ Sans vérifier package.json
```

#### ✅ Prévention
```bash
# Vérifier existence module local
ls -la ./utils.js

# Vérifier package installé
grep "axios" package.json

# Si absent → npm install OU utiliser fetch
```

## 🔴 Erreurs de Structure

### 1. Violation Architecture Monorepo

#### ❌ Mauvais Patterns
```
src/
  components/      ❌ Devrait être dans packages/
  new-module/      ❌ Pas kebab-case dans packages/
  test.js          ❌ Tests pas au bon endroit
```

#### ✅ Structure Correcte
```
packages/
  module-name/     ✅ kebab-case
    src/          ✅ Source du module
    tests/        ✅ Tests du module
    package.json  ✅ Config module
```

### 2. Nommage Incohérent

#### ❌ Erreurs Courantes
```
UserController.js   ❌ Dans un projet camelCase
user_service.js     ❌ Snake_case en JS
Test-Utils.js       ❌ Mélange de styles
my function.js      ❌ Espaces
```

#### ✅ Conventions Strictes
```
userController.js   ✅ camelCase pour fichiers JS
UserComponent.jsx   ✅ PascalCase pour composants
test-utils/        ✅ kebab-case pour dossiers
user.test.js       ✅ Pattern .test.js
```

## ⚠️ Anti-Patterns de Test

### 1. Tests Qui Passent Trop Facilement

#### ❌ Tests Suspects
```javascript
// Test inutile
test('should work', () => {
  expect(true).toBe(true)  // ❌ Toujours vert
})

// Test sans assertion réelle
test('should not crash', () => {
  myFunction()  // ❌ Pas de vérification
})
```

#### ✅ Tests Valides
```javascript
test('should calculate Elo correctly', () => {
  const result = calculate_elo_delta(1200, 1400, 32)
  expect(result).toBeCloseTo(24.7, 1)  // ✅ Assertion précise
  expect(result).toBeGreaterThan(0)    // ✅ Vérification sens
})
```

### 2. Couverture Trompeuse

#### ❌ Fausse Couverture
```javascript
// Code qui semble testé mais ne l'est pas vraiment
function complexFunction(a, b, c) {
  if (a) { /* branch 1 */ }
  if (b) { /* branch 2 */ }  // ❌ Branch non testé
  if (c) { /* branch 3 */ }
}

test('covers function', () => {
  complexFunction(true, false, true)  // ❌ Ne teste qu'un chemin
})
```

#### ✅ Vraie Couverture
```javascript
describe('complexFunction', () => {
  test.each([
    [true, true, true],
    [true, false, false],
    [false, true, false],
    // Toutes les combinaisons pertinentes
  ])('handles case (%p, %p, %p)', (a, b, c) => {
    // Test chaque branche
  })
})
```

## 🐛 Bugs Subtils Récurrents

### 1. Async/Await Oubliés

#### ❌ Bug Classique
```javascript
test('should fetch user', () => {
  const user = fetchUser(123)  // ❌ Manque await
  expect(user.name).toBe('John')  // undefined!
})

function processData() {
  saveToDatabase(data)  // ❌ Fire and forget
  return 'done'  // Retourne avant save
}
```

#### ✅ Correction
```javascript
test('should fetch user', async () => {
  const user = await fetchUser(123)  // ✅
  expect(user.name).toBe('John')
})

async function processData() {
  await saveToDatabase(data)  // ✅ Attend
  return 'done'
}
```

### 2. Mutations d'État Non Désirées

#### ❌ Mutation Dangereuse
```javascript
function processArray(arr) {
  arr.sort()  // ❌ Modifie array original
  return arr.map(x => x * 2)
}

const original = [3, 1, 2]
const result = processArray(original)
console.log(original)  // [1, 2, 3] - Modifié!
```

#### ✅ Immutabilité
```javascript
function processArray(arr) {
  const sorted = [...arr].sort()  // ✅ Copie
  return sorted.map(x => x * 2)
}
```

## 🎭 Faux Positifs en CI/CD

### 1. Tests Flaky

#### ❌ Sources de Flakiness
```javascript
// Dépendance au temps
test('should timeout', () => {
  setTimeout(done, 1000)  // ❌ Peut varier
})

// Dépendance réseau
test('should call API', () => {
  fetch('https://api.external.com')  // ❌ Peut échouer
})

// Ordre de tests
let globalState = 0
test('first', () => {
  globalState++  // ❌ Modifie état global
})
```

#### ✅ Tests Stables
```javascript
// Mock du temps
jest.useFakeTimers()
test('should timeout', () => {
  jest.advanceTimersByTime(1000)
})

// Mock réseau
test('should call API', () => {
  fetchMock.mockResponse({data: 'test'})
})

// Isolation
beforeEach(() => {
  globalState = 0  // Reset
})
```

## 💣 Erreurs de Performance

### 1. Algorithmes Inefficaces

#### ❌ O(n²) Caché
```javascript
function findDuplicates(arr) {
  const duplicates = []
  for (let i = 0; i < arr.length; i++) {
    for (let j = i + 1; j < arr.length; j++) {  // ❌ O(n²)
      if (arr[i] === arr[j]) {
        duplicates.push(arr[i])
      }
    }
  }
  return duplicates
}
```

#### ✅ O(n) Optimisé
```javascript
function findDuplicates(arr) {
  const seen = new Set()
  const duplicates = new Set()
  
  for (const item of arr) {  // ✅ O(n)
    if (seen.has(item)) {
      duplicates.add(item)
    }
    seen.add(item)
  }
  return Array.from(duplicates)
}
```

### 2. Memory Leaks

#### ❌ Leak Commun
```javascript
class EventManager {
  constructor() {
    this.listeners = []
  }
  
  addListener(fn) {
    this.listeners.push(fn)  // ❌ Jamais nettoyé
  }
}

// Utilisation
const manager = new EventManager()
setInterval(() => {
  manager.addListener(() => {})  // ❌ Leak!
}, 100)
```

#### ✅ Gestion Mémoire
```javascript
class EventManager {
  addListener(fn) {
    this.listeners.push(fn)
    return () => {  // ✅ Retourne cleanup
      this.listeners = this.listeners.filter(l => l !== fn)
    }
  }
}
```

## 📝 Erreurs de Git/Versioning

### 1. Commits Destructeurs

#### ❌ Commits Dangereux
```bash
git add .  # ❌ Ajoute tout sans vérifier
git commit -m "fix"  # ❌ Message non descriptif
git push --force  # ❌ Écrase historique
```

#### ✅ Commits Sûrs
```bash
git add -p  # ✅ Review interactif
git commit -m "fix(auth): validate token expiry"
git push --force-with-lease  # ✅ Force sécurisé
```

### 2. Merge Conflicts Mal Gérés

#### ❌ Résolution Dangereuse
```javascript
<<<<<<< HEAD
  const result = oldFunction()  
=======
  const result = newFunction()
>>>>>>> feature
  
// Résolution naïve:
const result = newFunction()  // ❌ Perd oldFunction
```

#### ✅ Résolution Réfléchie
```javascript
// Analyser les deux versions
// Peut-être garder les deux:
const result = isFeatureEnabled 
  ? newFunction() 
  : oldFunction()  // ✅ Migration progressive
```

## 🔍 Diagnostic Rapide

### Checklist Erreur Type

```markdown
□ Fichier créé non demandé ?
□ Import de module inexistant ?
□ Nom de fonction inventé ?
□ Test passe du premier coup ?
□ Modification dans /node_modules ?
□ Commit sur main direct ?
□ Structure non conforme ?
□ Message commit vague ?
□ Coverage en baisse ?
□ Performance dégradée ?
```

### Si une case cochée → INVESTIGUER

```bash
# Scripts de diagnostic
npm run check:structure    # Vérifie architecture
npm run check:imports      # Vérifie imports
npm run check:coverage     # Vérifie couverture
npm run check:performance  # Vérifie perfs
```

## 🛠️ Outils de Prévention

### Pre-commit Hooks
```json
// .husky/pre-commit
{
  "hooks": {
    "pre-commit": [
      "npm run lint",
      "npm test:affected",
      "npm run check:structure"
    ]
  }
}
```

### CI Checks
```yaml
# .github/workflows/ci.yml
- name: Validate no hallucinations
  run: |
    npm run validate:imports
    npm run validate:structure
    npm run validate:naming
```

---
**Rappel** : Chaque pattern d'erreur ici a été rencontré en production.

**Voir aussi** : CLAUDE.md | CLAUDE-WORKFLOWS.md | CLAUDE-VALIDATION.md