# CLAUDE-WORKFLOWS-v2.md - Workflows + TodoWrite Natif

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
    "TodoWrite",
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

<!-- AJOUT v2: Gestion TodoWrite native -->
## 📋 Gestion TodoWrite Native

### Principes TodoWrite v2
- **Outil exclusif** : Abandonner tasks/todo.md et fichiers externes
- **Tracking temps réel** : État synchronisé avec l'exécution
- **Classification auto** : Simple vs Complexe selon critères objectifs
- **Communication adaptée** : Verbosité graduée selon TodoWrite

### Workflow TodoWrite Optimisé
```markdown
# 1. Classification immédiate
Tâche reçue → Analyser complexité → Créer TodoWrite adapté

# 2. Exécution par état
- pending → in_progress (UNE SEULE à la fois)
- in_progress → completed (immédiatement après finition)
- Jamais de batch completion

# 3. Communication synchronisée
- Tâche simple : TodoWrite minimal, communication concise
- Tâche complexe : TodoWrite détaillé, validation collaborative
```

### Templates TodoWrite par Type

#### Tâche Simple (< 3 étapes)
```json
[
  {
    "content": "Fix bug authentication",
    "status": "in_progress",
    "activeForm": "Fixing authentication bug"
  }
]
```

#### Tâche Complexe (≥ 3 étapes)
```json
[
  {
    "content": "Analyze existing auth system structure",
    "status": "completed",
    "activeForm": "Analyzing existing auth system structure"
  },
  {
    "content": "Design new OAuth2 integration",
    "status": "in_progress",
    "activeForm": "Designing new OAuth2 integration"
  },
  {
    "content": "Implement OAuth2 provider configuration",
    "status": "pending",
    "activeForm": "Implementing OAuth2 provider configuration"
  },
  {
    "content": "Create integration tests for OAuth2 flow",
    "status": "pending",
    "activeForm": "Creating integration tests for OAuth2 flow"
  },
  {
    "content": "Update documentation and migration guide",
    "status": "pending",
    "activeForm": "Updating documentation and migration guide"
  }
]
```
<!-- FIN AJOUT v2 -->

## 🔄 Cycles de Développement

<!-- AJOUT v2: Cycle TDD avec TodoWrite -->
### Cycle TDD Complet v4.2 (avec TodoWrite)
```bash
# 1. Planification TodoWrite
# Classification: Simple ou Complexe
# Création TodoWrite adaptée

# 2. RED - Écriture des tests
# Marquer todo "Write failing test" as in_progress
vim tests/feature.test.js
# Vérifier qu'il échoue
npm test  # Doit montrer ❌
# Marquer todo as completed

# 3. GREEN - Implémentation minimale
# Marquer todo "Implement minimal code" as in_progress
vim src/feature.js
# Vérifier que ça passe
npm test  # Doit montrer ✅
# Marquer todo as completed

# 4. REFACTOR - Amélioration
# Si todos restants ET tous tests verts
npm run lint:fix
npm run format
npm test:all  # Tout doit rester ✅

# 5. Commit atomique
git add -p  # Review interactif
git commit -m "feat: [description]"
```
<!-- FIN AJOUT v2 -->

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

<!-- AJOUT v2: Agents avec TodoWrite -->
## 🤖 Agents + TodoWrite Integration

### Agent TodoWrite-Aware
```yaml
# .claude/agents/task-manager.yaml
name: task-manager
role: "Manage complex tasks with TodoWrite"
permissions:
  - TodoWrite
  - Bash(npm test*)
  - View(src/*)
instructions: |
  - Always create TodoWrite for tasks ≥3 steps
  - One todo in_progress at a time
  - Complete todos immediately after execution
  - Adapt communication to todo complexity

# .claude/agents/simple-executor.yaml
name: simple-executor
role: "Execute simple tasks efficiently"
permissions:
  - Edit
  - Bash(npm test*)
instructions: |
  - For tasks <3 steps
  - Minimal TodoWrite if any
  - Direct execution, concise communication
  - Focus on speed and accuracy
```

### Commandes Agents TodoWrite
```bash
# Lancer agent selon complexité tâche
claude --agent task-manager "Implement OAuth2 system"
claude --agent simple-executor "Fix typo in README"

# Agent de review avec TodoWrite tracking
claude --agent code-reviewer "Review my changes" --track-todos

# Créer agent TodoWrite-optimisé
claude /agents create --template todowrite-aware
```
<!-- FIN AJOUT v2 -->

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

<!-- AJOUT v2: Monitoring TodoWrite -->
## 📊 Monitoring & Métriques TodoWrite

### Dashboard TodoWrite Temps Réel
```bash
# Lancer dashboard avec tracking TodoWrite
npm run dashboard:todowrite
# Accès: http://localhost:8081

# Métriques TodoWrite disponibles:
# - Tâches complétées par session
# - Temps moyen par todo
# - Ratio simple/complexe
# - Taux de validation collaborative
# - Efficacité communication graduée
```

### Rapports TodoWrite
```bash
# Rapport d'efficacité TodoWrite
npm run todowrite:efficiency

# Analyse pattern complexité
npm run todowrite:complexity-analysis

# Rapport communication adaptative
npm run todowrite:communication-report
```
<!-- FIN AJOUT v2 -->

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