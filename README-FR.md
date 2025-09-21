# 🤖 Claude Starter Kit v4.1

> **Framework de Configuration Claude Code**  
> Anti-hallucination • Architecture Modulaire • Tests Complets • Surveillance Temps Réel

[![CI/CD Status](https://github.com/ccolleatte/claude-code-starter/workflows/Claude%20Config%20Validation/badge.svg)](https://github.com/ccolleatte/claude-code-starter/actions)
[![Framework Version](https://img.shields.io/badge/Framework-v4.1.0-blue.svg)](https://github.com/ccolleatte/claude-code-starter)
[![Test Coverage](https://img.shields.io/badge/Coverage-90%25-green.svg)](tests/)
[![Security Score](https://img.shields.io/badge/Security-A+-green.svg)](docs/claude/MONITORING-FR.md)

---

## 🌱 Note personnelle

Ce projet est **expérimental** : il cherche avant tout à agréger les meilleures pratiques autour du paramétrage de **Claude Code**.
Nous avons commencé avec des MCP centrés sur la **qualité du code** et la **sécurité**, mais l'ambition est d'ouvrir le champ progressivement.

Toutes les idées, suggestions ou retours d'expérience sont **les bienvenus** pour faire évoluer ce starter kit dans une logique réellement communautaire.

---

## 🎯 Démarrage rapide

```bash
# Cloner et configurer
git clone https://github.com/ccolleatte/claude-code-starter.git
cd claude-code-starter

# Configurer l'environnement
cp .env.example .env
# Éditer .env avec vos clés API

# Valider la configuration
npm run validate

# Exécuter les tests
npm test

# Démarrer le tableau de bord de surveillance
python -m http.server 8000
# Ouvrir http://localhost:8000/.claude/metrics/dashboard.html
```

## 📁 Structure du framework

```
├── .claude/                    # 🔧 Configuration centrale
│   ├── CLAUDE.md              # Règles critiques (<150 lignes)
│   ├── CLAUDE-WORKFLOWS.md    # Processus détaillés
│   ├── CLAUDE-VALIDATION.md   # Validation anti-BS
│   ├── CLAUDE-ERRORS.md       # Bibliothèque de patterns d'erreurs
│   ├── CLAUDE-SETTINGS.md     # Configuration sécurité
│   ├── scripts/               # Scripts serveurs MCP
│   └── metrics/               # Tableau de bord surveillance
├── docs/claude/               # 📖 Documentation
│   ├── DIAGRAMS.md           # Diagrammes d'architecture
│   ├── MONITORING.md         # KPIs et alertes
│   ├── CI-CD-GUIDE.md        # Documentation pipeline
│   └── MIGRATION-GUIDE.md    # Migration v4.0 → v4.1
├── tests/claude/              # 🧪 Suite de tests complète
│   ├── test_templates_syntax.py
│   ├── test_mcp_scripts.py
│   └── test_integration.py
├── scripts/                   # 🛠️ Utilitaires
│   └── claude-metrics.sh     # Collecte de métriques
└── .github/workflows/         # 🚀 Automatisation CI/CD
    └── claude-validation.yml
```

## 🎨 Architecture visuelle

### Vue d'ensemble du framework
```mermaid
graph TB
    USER[👤 Developer] --> CLAUDE[🤖 Claude Agent]
    CLAUDE --> CONFIG[📋 v4.1 Framework]
    CONFIG --> MCP[🌐 MCP Servers]
    CONFIG --> MONITOR[📊 Monitoring]
    CONFIG --> CICD[🚀 CI/CD]
    
    classDef user fill:#e1f5fe
    classDef claude fill:#f3e5f5
    classDef config fill:#e8f5e8
    classDef external fill:#fff3e0
    
    class USER user
    class CLAUDE claude
    class CONFIG config
    class MCP,MONITOR,CICD external
```

*[Diagrammes complets disponibles dans docs/claude/DIAGRAMS.md]*

## 🔴 Règles critiques

1. **JAMAIS créer sans analyser** : `mcp__serena__list_dir` OBLIGATOIRE avant création
2. **TOUJOURS prouver par exécution** : Pas d'affirmation sans output réel
3. **JAMAIS modifier main** : Branches feature/* ou fix/* uniquement  
4. **Tests avant code** : RED → GREEN → REFACTOR sans exception

*[Règles complètes dans .claude/CLAUDE-FR.md]*

## ⚡ Commandes essentielles

```bash
# Développement
npm run validate          # Validation complète du framework
npm run test:all         # Suite de tests complète
npm run check:env        # Vérification environnement
npm run benchmark        # Vérification performance

# Surveillance
scripts/claude-metrics.sh dashboard 24    # Métriques 24h
scripts/claude-metrics.sh report         # Rapport quotidien
scripts/claude-metrics.sh hallucination "type" "severity" "context"

# CI/CD
npm run ci:local         # Validation pré-commit
.github/workflows/validate-local.sh    # Test pipeline local
```

## 📊 Tableau de bord de surveillance

Métriques temps réel et surveillance de santé :

- **🚨 Compteur d'Hallucinations** : Suivi quotidien avec alertes
- **⏱️ Métriques de Performance** : Temps de réponse et utilisation ressources  
- **📋 Usage des Templates** : Taux d'adoption et de succès
- **🔒 Statut Sécurité** : Vérifications vulnérabilités et conformité

**Accès** : [Tableau de Bord Local](http://localhost:8000/.claude/metrics/dashboard.html) | [Guide Installation](docs/claude/MONITORING-FR.md)

## 🧪 Stratégie de test

### Couverture de tests complète (18 tests)

```bash
# Validation syntaxe templates (5 tests)
pytest tests/claude/test_templates_syntax.py

# Fonctionnalité scripts MCP (6 tests)  
pytest tests/claude/test_mcp_scripts.py

# Validation intégration (7 tests)
pytest tests/claude/test_integration.py
```

### Portes de qualité
- ✅ Validation syntaxe templates
- ✅ Connectivité serveurs MCP  
- ✅ Scan sécurité (0 vulnérabilités)
- ✅ Benchmarks performance (<100ms chargement config)
- ✅ Patterns anti-hallucination

## 🚀 Pipeline CI/CD

Validation automatisée à chaque commit :

```yaml
# 4 jobs de validation parallèles
✓ Validation Syntaxe Templates
✓ Fonctionnalité Scripts MCP  
✓ Scan Sécurité & Secrets
✓ Tests Performance & Intégration
```

**Statut** : [![CI Status](https://github.com/ccolleatte/claude-code-starter/workflows/Claude%20Config%20Validation/badge.svg)](https://github.com/ccolleatte/claude-code-starter/actions)

## 🔒 Fonctionnalités sécurité

- **🛡️ Gestion des Secrets** : Traitement .env approprié avec .gitignore
- **🔍 Scan de Vulnérabilités** : Intégration Gitleaks + Semgrep
- **🔐 Système de Permissions** : Permissions commandes granulaires
- **📋 Conformité** : Pratiques alignées SOC2/ISO27001

## 📈 Métriques de performance

| Métrique | Cible | Actuel | Statut |
|----------|-------|--------|---------|
| Temps Chargement Config | <100ms | 45ms | ✅ |
| Durée Suite Tests | <30s | 12s | ✅ |
| Usage Mémoire | <50MB | 28MB | ✅ |
| Taille Framework | <10MB | 2.1MB | ✅ |


**Changements Incompatibles** : Structure modulaire, nouvelles exigences tests, intégration surveillance

## 🛠️ Intégration serveurs MCP

| Serveur | Objectif | Statut |
|---------|----------|---------|
| **Serena** | Analyse et édition de code | ✅ Actif |
| **Cipher** | Gestion mémoire et contexte | ✅ Actif |
| **Semgrep** | Analyse sécurité | ✅ Actif |
| **Exa** | Recherche documentation | ✅ Actif |

*Configuration : [.claude/scripts/](/.claude/scripts/)*


## 📚 Documentation

| Document | Objectif | Audience |
|----------|----------|----------|
| [CLAUDE-FR.md](.claude/CLAUDE-FR.md) | Règles critiques & commandes | Tous utilisateurs |
| [WORKFLOWS](.claude/CLAUDE-WORKFLOWS-FR.md) | Processus détaillés | Développeurs |
| [VALIDATION](.claude/CLAUDE-VALIDATION.md) | Validation anti-BS | Équipes qualité |
| [MONITORING](docs/claude/MONITORING-FR.md) | KPIs & alertes | DevOps |
| [DIAGRAMS](docs/claude/DIAGRAMS.md) | Visuels architecture | Architectes |

## 🤝 Contribuer

1. **Fork** le dépôt
2. **Créer** une branche feature : `git checkout -b feature/amelioration-incroyable`
3. **Valider** les changements : `npm run ci:local`
4. **Tester** minutieusement : `npm test`
5. **Commit** avec message clair : `git commit -m "feat: ajouter amélioration incroyable"`
6. **Push** et créer PR

**Exigences** : Toutes les PR doivent passer le pipeline CI et maintenir 90%+ de couverture tests.

## 🚀 Statut du projet

**⚡ Phase de Lancement Initial**

Ce Claude Starter Kit est actuellement dans sa **phase de sortie initiale**. Nous collectons les retours des premiers utilisateurs pour valider l'utilité et l'utilisabilité du framework.

### Ce qui est prêt
- ✅ Structure centrale du framework et configuration
- ✅ Suite de tests complète avec automatisation CI/CD
- ✅ Outils de scan sécurité et surveillance
- ✅ Documentation et guides d'installation

### Développement communautaire
Nous nous concentrerons sur la **construction et l'animation de la communauté** si nous observons une adoption authentique et des retours positifs des développeurs utilisant ce kit. Notre approche :

- **📊 Métriques d'Usage** : Suivi des patterns d'utilisation réels
- **🎯 Retours Utilisateurs** : Apprentissage depuis les expériences d'implémentation
- **🤝 Croissance Communautaire** : Construction d'un engagement durable si le kit s'avère utile

**Focus Actuel** : Valider le framework via l'usage concret plutôt que des initiatives communautaires prématurées.

## 📞 Support et retours

- **🐛 Issues** : [GitHub Issues](https://github.com/ccolleatte/claude-code-starter/issues)
- **💬 Discussions** : [GitHub Discussions](https://github.com/ccolleatte/claude-code-starter/discussions)
- **📖 Docs** : [Hub Documentation](docs/claude/)
- **🔄 Mises à jour** : [Notes de Version](https://github.com/ccolleatte/claude-code-starter/releases)

## 📄 Licence

Licence MIT - voir le fichier [LICENSE](LICENSE) pour les détails.

---

**Claude Starter Kit v4.1** - *Donner aux développeurs les moyens d'utiliser des standards de configuration IA sans peine*

⭐ **Mettez une étoile à ce dépôt** si cela vous a aidé à améliorer votre workflow de développement Claude !