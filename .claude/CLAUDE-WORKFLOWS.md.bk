# CLAUDE-WORKFLOWS.md - Workflows & Commandes Détaillés

## 🚀 Setup Initial Complet

### Installation Projet
```bash
# 1. Clone et setup de base
git clone [repo-url]
cd [project-name]
npm install
npm run setup:complete

# 2. Configuration Cipher (mémoire persistante)
cp .env.cipher.example .env.cipher
# Éditer .env.cipher avec vos clés
./scripts/setup-cipher.sh
./scripts/setup-cipher-global.sh

# 3. Docker (optionnel mais recommandé)
docker-compose build
docker-compose up -d

# 4. Validation installation
npm run check:env
npm test:all
```

### Configuration Claude Code
```json
// .claude/settings.json
{
  "allowedTools": [
    "Edit",
    "Bash(pytest *)",
    "Bash(npm test*)",
    "Bash(git status)",
    "Bash(git diff)"
  ],
  "model": "claude-opus-4-1-20250805",
  "agents": {
    "useSubagents": true
  },
  "autoAcceptThreshold": "never"
}
```

## 🔄 Cycles de Développement

### Cycle TDD Complet v4.0
```bash
# 1. Planification
npm run estimator:workflow docs/PRD.md  # Estimation automatique

# 2. RED - Écriture des tests
# Créer/modifier le fichier de test
vim tests/feature.test.js
# Vérifier qu'il échoue
npm test  # Doit montrer ❌

# 3. GREEN - Implémentation minimale  
# Coder juste assez
vim src/feature.js
# Vérifier que ça passe
npm test  # Doit montrer ✅

# 4. REFACTOR - Amélioration
# Si tous les tests passent
npm run lint:fix
npm run format
npm test:all  # Tout doit rester ✅

# 5. Commit atomique
git add -p  # Review interactif
git commit -m "feat: [description]"
```

### Workflow Hot-Reload Optimisé
```bash
# Terminal 1 - Backend
npm run dev:backend
# Hot-reload <500ms sur changements Python

# Terminal 2 - Frontend  
npm run dev:frontend
# Hot-reload React/Vue instantané

# Terminal 3 - Tests en continu
npm run test:watch
# Re-run automatique tests affectés

# Terminal 4 - Dashboard métriques
npm run dashboard
# http://localhost:8080
```

## 🧪 Stratégies de Test

### Test Impact Analysis v4.0
```bash
# Utilisation normale (RAPIDE)
npm test  # Sélection intelligente des tests

# Voir quels tests seront exécutés
npm test:affected --dry-run

# Forcer suite complète
npm test:all

# Régénérer la carte de dépendances
npm run test:map:rebuild

# Tests dans Docker isolé
docker-compose run test-runner
```

### Tests par Contexte
```bash
# Tests unitaires seulement
npm run test:unit

# Tests intégration
npm run test:integration

# Tests E2E (browser)
npm run test:e2e

# Tests de performance
npm run test:perf

# Tests de sécurité
npm run test:security
```

## 🤖 Utilisation des Agents

### Configuration Agents Spécialisés
```yaml
# .claude/agents/test-runner.yaml
name: test-runner
role: "Execute and analyze test results"
permissions:
  - Bash(pytest *)
  - Bash(npm test*)
  - View(tests/*)
instructions: |
  - Run tests and parse TAP output
  - Identify real failures vs flaky
  - Suggest fixes based on errors

# .claude/agents/code-reviewer.yaml  
name: code-reviewer
role: "Review code changes"
permissions:
  - View(src/*)
  - Bash(git diff)
instructions: |
  - Check style compliance
  - Identify potential bugs
  - Verify test coverage
```

### Commandes Agents
```bash
# Lancer un agent spécifique
claude --agent test-runner "Run all tests"

# Agent de review
claude --agent code-reviewer "Review my changes"

# Créer nouvel agent
claude /agents create optimizer

# Lister agents disponibles
claude /agents list
```

## 📦 Workflows NPM Scripts

### Scripts Essentiels
```bash
# Développement
npm run dev              # Full stack hot-reload
npm run dev:docker       # Dev dans containers

# Qualité
npm run lint             # ESLint + Ruff
npm run lint:fix         # Auto-fix
npm run format           # Prettier + Black

# Build & Deploy
npm run build            # Production build
npm run build:docker     # Build containers
npm run deploy:staging   # Deploy staging
npm run deploy:prod      # Deploy production

# Maintenance
npm run clean            # Nettoyer build/cache
npm run deps:update      # Update dependencies
npm run deps:audit       # Security audit
```

### Scripts Composés
```bash
# Validation complète avant commit
npm run pre-commit
# Équivalent à:
# - lint:fix
# - format  
# - test
# - ai:review

# CI complet
npm run ci:complete
# Équivalent à:
# - clean
# - install
# - build
# - test:all
# - coverage:check
```

## 🐳 Docker Workflows

### Commandes Docker
```bash
# Build initial
docker-compose build --no-cache

# Développement
docker-compose up app  # App avec hot-reload
docker-compose up -d   # Tout en background

# Tests
docker-compose run test-runner
docker-compose run test-runner pytest tests/specific/

# Logs et debug
docker-compose logs -f app
docker-compose exec app bash

# Nettoyage
docker-compose down -v  # Stop et supprime volumes
docker system prune -a  # Nettoyage complet
```

### Docker pour CI/CD
```bash
# Build multi-stage optimisé
docker build --target production -t app:latest .

# Tests dans container identique à prod
docker run --rm app:latest npm test:all

# Analyse de sécurité
docker scan app:latest
```

## 🔍 Workflows de Debug

### Debug Tests Échoués
```bash
# 1. Identifier le test exact
npm test -- --verbose

# 2. Run isolé avec debug
pytest tests/failing.test.py -vvs --pdb

# 3. Avec breakpoint
node --inspect-brk ./node_modules/.bin/jest tests/

# 4. Coverage pour voir lignes non testées
npm test -- --coverage --coverageReporters=html
open coverage/index.html
```

### Debug Performance
```bash
# Profiling Python
python -m cProfile -o profile.stats src/main.py
snakeviz profile.stats

# Profiling Node.js
node --prof src/index.js
node --prof-process isolate-*.log > profile.txt

# Benchmark
npm run benchmark
```

## 🔄 Git Workflows

### Branches et Commits
```bash
# Nouvelle feature
git checkout -b feature/nom-feature
git push -u origin feature/nom-feature

# Commits atomiques
git add -p  # Sélection interactive
git commit -m "type(scope): description"
# Types: feat|fix|docs|style|refactor|test|chore

# Sync avec main
git fetch origin
git rebase origin/main
```

### Recovery Patterns
```bash
# Annuler dernier commit (garder changements)
git reset --soft HEAD~1

# Annuler et perdre changements
git reset --hard HEAD~1

# Sauvegarder travail en cours
git stash push -m "WIP: description"
git stash pop

# Retrouver commit perdu
git reflog
git cherry-pick [commit-hash]
```

## 📊 Monitoring & Métriques

### Dashboard Temps Réel
```bash
# Lancer dashboard
npm run dashboard
# Accès: http://localhost:8080

# Métriques disponibles:
# - Test execution time
# - Coverage trends  
# - Build performance
# - Flaky tests
# - CI pipeline status
```

### Rapports Automatisés
```bash
# Rapport de santé projet
npm run health:check

# Analyse de dette technique
npm run debt:analyze

# Rapport de performance
npm run perf:report
```

## 🌐 Intégrations Externes

### Supabase
```bash
# Migration DB
supabase migration new feature_name
supabase migration up

# Seed data
supabase seed

# Backup
supabase backup create
```

### n8n Workflows
```bash
# Export workflow
n8n export:workflow [id] > workflow.json

# Import workflow  
n8n import:workflow < workflow.json

# Test webhook
curl -X POST http://localhost:5678/webhook/[id]
```

## 🚨 Workflows d'Urgence

### Rollback Production
```bash
# 1. Identifier le dernier bon deploy
git log --oneline -10

# 2. Revert
git revert HEAD --no-edit
git push origin main

# 3. Ou rollback via tag
git checkout production-v1.2.3
git tag -f production-current
git push -f origin production-current
```

### Hotfix Critique
```bash
# 1. Créer branche depuis prod
git checkout -b hotfix/critical main

# 2. Fix + test
# ... fix ...
npm test:all

# 3. Merge direct dans main
git checkout main
git merge hotfix/critical
git push origin main

# 4. Tag
git tag -a hotfix-v1.2.4 -m "Critical fix"
git push origin hotfix-v1.2.4
```

---
**Voir aussi** : CLAUDE.md | CLAUDE-VALIDATION.md | CLAUDE-ERRORS.md