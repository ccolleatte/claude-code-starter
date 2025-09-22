# CLAUDE-WORKFLOWS-FR.md - Flux de Travail Détaillés v4.1

Guide opérationnel complet pour le Framework de Configuration Claude Code.

## 🔧 Configuration initiale

### Pré-requis
- Node.js ≥16.0.0
- Python ≥3.8.0
- Git configuré
- Éditeur avec support Markdown

### Configuration rapide
```bash
# 1. Cloner le framework
git clone https://github.com/ccolleatte/claude-code-starter.git
cd claude-code-starter

# 2. Configuration environnement
cp .env.example .env
# Éditer .env avec tes clés API

# 3. Validation initiale
npm run validate
npm test

# 4. Test serveurs MCP
bash .claude/scripts/serena-mcp.sh --validate
bash .claude/scripts/cipher-mcp.sh --validate
```

### Structure workspace
```
project/
├── .claude/          # Config Claude v4.1
├── .env             # Variables environnement  
├── .gitignore       # Exclusions Git
├── package.json     # Scripts npm
└── src/             # Code source
```

## 🎯 Flux de travail TDD strict

### Cycle rouge-vert-refactorisation

#### 1. ROUGE - Écrire Test Qui Échoue
```bash
# Créer nouveau test
echo "describe('myFunction', () => {
  test('should return expected result', () => {
    expect(myFunction(input)).toBe(expected)
  })
})" > tests/myFunction.test.js

# Exécuter test (DOIT échouer)
npm test tests/myFunction.test.js
# ❌ ReferenceError: myFunction is not defined
```

#### 2. VERT - Code Minimal Pour Passer
```bash
# Créer implémentation minimale
echo "function myFunction(input) {
  return expected // Hard-codé pour passer test
}
module.exports = { myFunction }" > src/myFunction.js

# Test DOIT maintenant passer
npm test tests/myFunction.test.js
# ✅ Tests: 1 passed, 1 total
```

#### 3. REFACTORISATION - Améliorer Sans Casser
```bash
# Améliorer implémentation
vim src/myFunction.js
# Logique réelle remplace hard-coding

# Vérifier que tout reste vert
npm test:all
# ✅ Tests: X passed, X total
```

### Règles TDD strictes
1. **Jamais de code sans test qui échoue d'abord**
2. **Code minimal juste pour passer le test**
3. **Refactoriser seulement quand tout est vert**
4. **1 échec = ARRÊT et corriger immédiatement**

## 🔄 Flux de travail Git standard

### Branches et conventions
```bash
# Création branche feature
git checkout -b feature/add-user-authentication
git checkout -b fix/memory-leak-in-parser
git checkout -b refactor/optimize-query-performance

# Convention commits
git commit -m "feat: add JWT authentication"
git commit -m "fix: resolve memory leak in parser"
git commit -m "refactor: optimize database queries"
git commit -m "test: add unit tests for auth service"
git commit -m "docs: update API documentation"
```

### Flux de travail complet
```bash
# 1. Synchroniser avec main
git checkout main
git pull origin main

# 2. Créer branche
git checkout -b feature/my-feature

# 3. Développement avec points de contrôle
git add . && git commit -m "checkpoint: basic structure"
# ... développement ...
git add . && git commit -m "checkpoint: core logic implemented"
# ... tests ...
git add . && git commit -m "feat: complete feature implementation"

# 4. Validation pré-push
npm run ci:local
npm test:all

# 5. Push et PR
git push -u origin feature/my-feature
# Créer Pull Request via interface GitHub
```

### Règles de Sécurité Git
```bash
# JAMAIS directement sur main
git checkout main && echo "❌ INTERDIT"

# TOUJOURS valider avant push
npm run validate || git reset --hard HEAD

# Protection contre push accidentel
git config --global push.default simple
git config --global push.autoSetupRemote true
```

## 🧪 Flux de Travail Tests

### Hiérarchie Tests
```bash
# 1. Tests unitaires (rapides)
npm run test:unit
# Focus: Fonctions isolées

# 2. Tests intégration (modérés)  
npm run test:integration
# Focus: Modules interconnectés

# 3. Tests end-to-end (lents)
npm run test:e2e
# Focus: Scénarios utilisateur complets
```

### Stratégies par Type de Code

#### Tests pour Fonctions Pures
```javascript
// ✅ Bon test - fonction pure
test('calculateElo should return correct delta', () => {
  const result = calculateElo(1200, 1400, 32)
  expect(result).toBeCloseTo(24.7, 1)
  expect(result).toBeGreaterThan(0)
})
```

#### Tests pour APIs/Async
```javascript
// ✅ Bon test - API async
test('fetchUser should return user data', async () => {
  const mockResponse = { id: 1, name: 'Test User' }
  fetchMock.mockResponseOnce(JSON.stringify(mockResponse))
  
  const user = await fetchUser(1)
  expect(user).toEqual(mockResponse)
  expect(fetchMock).toHaveBeenCalledWith('/api/users/1')
})
```

#### Tests pour Composants UI
```javascript
// ✅ Bon test - composant React
test('Button should call onClick when clicked', () => {
  const mockClick = jest.fn()
  render(<Button onClick={mockClick}>Click me</Button>)
  
  fireEvent.click(screen.getByText('Click me'))
  expect(mockClick).toHaveBeenCalledTimes(1)
})
```

### Objectifs Coverage
- **Chemins critiques**: 100% de couverture
- **Logique métier**: ≥95% de couverture  
- **Composants UI**: ≥85% de couverture
- **Utilitaires**: ≥90% de couverture

## 🐛 Flux de Travail Débogage

### Débogage Systématique
```bash
# 1. Reproduction du bug
npm test -- --watch failing-test.spec.js

# 2. Isoler le problème
node --inspect-brk test-file.js
# Ouvrir Chrome DevTools

# 3. Logging stratégique
console.log('DEBUG:', { variable, context, timestamp: Date.now() })

# 4. Bisect Git si nécessaire
git bisect start
git bisect bad HEAD
git bisect good last-known-working-commit
```

### Outils de Débogage Recommandés
```bash
# Débogage Node.js
node --inspect-brk app.js
# Chrome://inspect

# Débogage Python
python -m pdb script.py
# (Pdb) commands

# Débogage réseau
curl -v https://api.example.com
# Ou utiliser Bruno/Postman

# Profilage performance
npm run benchmark
node --prof app.js && node --prof-process isolate-*.log
```

## 🚀 Flux de Travail CI/CD

### Pipeline Local (Pré-commit)
```bash
# Script validation complète
#!/bin/bash
set -e

echo "🔍 Linting..."
npm run lint

echo "🧪 Tests..."
npm test

echo "🔒 Scan sécurité..."
npm audit
npm run security:scan

echo "📦 Test build..."
npm run build

echo "✅ Prêt à commit!"
```

### Pipeline GitHub Actions
```yaml
name: Claude Validation
on: [push, pull_request]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
      
      - run: npm ci
      - run: npm run validate
      - run: npm test
      - run: npm run build
```

## 🔧 Flux de Travail Serveurs MCP

### Configuration Serveurs
```bash
# Test connectivité
.claude/scripts/serena-mcp.sh --test
.claude/scripts/cipher-mcp.sh --test
.claude/scripts/semgrep-mcp.sh --test
.claude/scripts/exa-mcp.sh --test

# Debug connexion
MCP_DEBUG=1 .claude/scripts/serena-mcp.sh

# Redémarrer si problème
pkill -f "mcp-server" && sleep 2
.claude/scripts/serena-mcp.sh --restart
```

### Patterns d'Usage MCP
```bash
# Serena - Analyse de code
mcp__serena__list_dir "src/"
mcp__serena__find_symbol "calculateElo"
mcp__serena__replace_symbol_body "MyClass/myMethod" "nouvelle implémentation"

# Cipher - Mémoire/Contexte
cipher store architecture "Décisions architecturales clés..."
cipher recall patterns "authentication"

# Semgrep - Sécurité
semgrep --config=p/security src/
semgrep --config=p/owasp-top-10 .

# Exa - Documentation
exa search "React hooks best practices 2024"
exa search "Node.js performance optimization"
```

## 📊 Flux de Travail Surveillance

### Métriques Quotidiennes
```bash
# Vérification matinale
scripts/claude-metrics.sh dashboard 24
scripts/claude-metrics.sh report yesterday

# Revue des alertes
grep "ALERT" .claude/metrics/claude-metrics.log | tail -10

# Baseline performance
npm run benchmark
scripts/claude-metrics.sh response-time "daily-check" $(date +%s.%3N)
```

### Vérifications Santé
```bash
# Santé système
df -h                    # Espace disque
free -h                  # Mémoire
top -bn1 | head -20     # CPU/Processus

# Santé application
npm run health-check
curl -f http://localhost:3000/health || echo "Service down"

# Santé framework
npm run validate
npm test:quick
```

## 🛠️ Flux de Travail Maintenance

### Nettoyage Hebdomadaire
```bash
# Nettoyer dépendances
npm audit fix
npm outdated
npm update

# Nettoyer Git
git branch --merged | grep -v main | xargs git branch -d
git gc --prune=now

# Nettoyer logs
find . -name "*.log" -mtime +7 -delete
scripts/claude-metrics.sh cleanup 7

# Nettoyer cache
npm cache clean --force
rm -rf node_modules/.cache
```

### Mises à Jour Mensuelles
```bash
# Mises à jour dépendances
npm-check-updates -u
npm install
npm test

# Mises à jour sécurité
npm audit
npm run security:update

# Mises à jour framework
git fetch origin
git merge origin/main
npm run migrate:check
```

## 🎛️ Flux de Travail Multi-Terminal

### Disposition Terminal Recommandée
```bash
# Terminal 1: Développement
cd project/ && npm run dev

# Terminal 2: Tests en watch
npm run test:watch

# Terminal 3: Surveillance
watch -n 30 'scripts/claude-metrics.sh dashboard 1'

# Terminal 4: Commandes
# Terminal libre pour Git, npm, etc.
```

### Scripts Productivité
```bash
# Ajouts .bashrc
alias c="clear"
alias l="ls -la"
alias g="git"
alias n="npm"
alias t="npm test"
alias v="npm run validate"

# Spécifiques Claude
alias cmetrics="scripts/claude-metrics.sh dashboard 24"
alias cvalidate="npm run ci:local"
alias ctests="npm run test:claude"
```

## 🔄 Flux de Travail Docker (Optionnel)

### Conteneur Développement
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev"]
```

### Commandes Docker
```bash
# Build image développement
docker build -t claude-dev .

# Exécuter avec montage volume
docker run -v $(pwd):/app -p 3000:3000 claude-dev

# Docker Compose pour services
docker-compose up -d database redis
npm run dev
```

## 📋 Checklist Flux de Travail Complet

### Avant Chaque Session
- [ ] `git status` - État propre
- [ ] `npm run validate` - Framework OK
- [ ] `scripts/claude-metrics.sh dashboard 1` - Santé système
- [ ] Objectifs session définis

### Pendant Développement  
- [ ] TDD strict: Rouge → Vert → Refactorisation
- [ ] Commits fréquents avec messages clairs
- [ ] Tests passent en continu
- [ ] Pas de warnings/erreurs lint

### Avant Commit
- [ ] `npm run ci:local` - Validation complète
- [ ] `npm test:all` - Tous tests passent
- [ ] `git diff` - Review changements
- [ ] Message commit descriptif

### Fin de Session
- [ ] Push branche si prête
- [x] Session documentée et validée
- [ ] `scripts/claude-metrics.sh report` - Métriques jour
- [ ] Nettoyage terminal/processus

---
**Version** : 4.1.0 | **Usage** : Opérations Quotidiennes | **Mise à jour** : Continue