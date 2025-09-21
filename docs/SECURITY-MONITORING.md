# 🔐 Security Monitoring Guide
## Claude Starter Kit v4.1

Ce guide explique l'utilisation du système de monitoring sécurité intégré, implémentant les recommandations SEC-001 et SEC-002.

---

## 🎯 Overview

Le système de monitoring sécurité fournit :
- **Scan automatisé des dépendances** (SEC-001)
- **Monitoring temps réel des événements** (SEC-002) 
- **Dashboard sécurité interactif**
- **Alertes automatiques** sur seuils configurables

---

## 🚀 Quick Start

### 1. **Initialisation**
```bash
npm run security:init
```

### 2. **Scan sécurité complet**
```bash
npm run security:scan
```

### 3. **Status sécurité**
```bash
npm run security:status
```

### 4. **Dashboard sécurité**
```bash
npm run security:dashboard
# Ouvre security-dashboard.html dans votre navigateur
```

---

## 🔍 **SEC-001: Dependency Scanning**

### GitHub Actions Workflow
Le scan automatisé s'exécute :
- ✅ À chaque push sur main/develop
- ✅ À chaque pull request
- ✅ Quotidiennement à 2h UTC
- ✅ Manuellement via workflow_dispatch

### Outils de Scan
1. **NPM Audit** - Vulnérabilités JavaScript
2. **Python Safety** - Vulnérabilités Python
3. **pip-audit** - Audit complémentaire Python
4. **GitHub CodeQL** - Analyse statique code
5. **Dependency Review** - Review automatique PRs

### Seuils d'Alerte
```yaml
Critical Vulnerabilities: 0 (Bloque CI/CD)
High Vulnerabilities: 0 (Bloque CI/CD)
Medium Vulnerabilities: <5 (Warning)
Low Vulnerabilities: <10 (Info)
```

### Configuration
```bash
# Personnaliser niveaux d'audit
npm audit --audit-level moderate

# Scan spécifique Python
safety check --json
pip-audit --format=json
```

---

## 🛡️ **SEC-002: Security Event Monitoring**

### Monitoring Temps Réel
```bash
# Démarrer monitoring continu
npm run security:monitor &

# Status en temps réel
npm run security:status
```

### Types d'Événements Surveillés

#### 🔴 **CRITICAL**
- Exposition potentielle clés API
- Tentatives accès non autorisé
- Modifications fichiers sensibles

#### 🟠 **HIGH**
- Tentatives path traversal
- Échecs authentification multiples
- Patterns d'attaque détectés

#### 🟡 **MEDIUM**
- Activations debug mode excessives
- Erreurs configuration répétées
- Utilisation ressources anormale

#### 🟢 **LOW/INFO**
- Erreurs opérationnelles
- Activité debug normale
- Événements informationnels

### Configuration des Seuils
Fichier `.security-thresholds` :
```bash
# Seuils personnalisables
MAX_FAILED_OPERATIONS=5
MAX_DEBUG_ACTIVATIONS=3
ALERT_TIME_WINDOW=3600  # 1 heure

# Features monitoring
ENABLE_REAL_TIME_MONITORING=true
ENABLE_PATTERN_DETECTION=true
SECURITY_LOG_RETENTION_DAYS=30
```

---

## 📊 **Dashboard Sécurité**

### Génération Dashboard
```bash
npm run security:dashboard
```

### Métriques Affichées
- **Security Health Score** (0-100)
- **Événements 24h** par sévérité
- **Status système** (HEALTHY/WARNING/CRITICAL)
- **Événements récents** avec détails

### Auto-Refresh
- Dashboard se rafraîchit toutes les 5 minutes
- Métriques mises à jour automatiquement
- Status temps réel sans rechargement manuel

---

## 🔧 **Commandes Disponibles**

### Scripts NPM
```bash
npm run security:init      # Initialiser monitoring
npm run security:scan      # Scan complet logs + métriques
npm run security:monitor   # Monitoring temps réel (continu)
npm run security:status    # Status actuel sécurité
npm run security:dashboard # Générer dashboard HTML
npm run security:metrics   # Générer métriques uniquement
```

### Scripts Bash Directs
```bash
# Commandes avancées
bash scripts/security-monitor.sh init
bash scripts/security-monitor.sh scan
bash scripts/security-monitor.sh monitor
bash scripts/security-monitor.sh status
bash scripts/security-monitor.sh metrics
bash scripts/security-monitor.sh dashboard
```

---

## 📁 **Structure des Fichiers**

### Logs Sécurité
```
logs/
├── security-events.log      # JSON structuré
├── security-readable.log    # Format humain
└── monitoring.log          # Logs système monitoring
```

### Métriques
```
metrics/
├── security-20250919.json  # Métriques quotidiennes
├── security-20250920.json
└── ...
```

### Configuration
```
.security-thresholds         # Seuils personnalisés
security-dashboard.html      # Dashboard généré
```

---

## 🚨 **Alertes et Réponse aux Incidents**

### Niveaux d'Alerte

#### 🔴 **CRITICAL - Action Immédiate**
```bash
# Vérification immédiate
npm run security:status

# Génération rapport détaillé
npm run security:metrics

# Review logs détaillés
tail -f logs/security-events.log
```

#### 🟠 **HIGH - Action Rapide (< 1h)**
```bash
# Analyse pattern suspect
grep "HIGH" logs/security-readable.log

# Vérification contexte
npm run security:dashboard
```

#### 🟡 **MEDIUM - Action Planifiée (< 24h)**
```bash
# Review périodique
npm run security:scan

# Ajustement seuils si nécessaire
edit .security-thresholds
```

### Procédure d'Escalation
1. **CRITICAL** → Notification immédiate équipe sécurité
2. **HIGH** → Investigation dans l'heure
3. **MEDIUM** → Review lors du prochain cycle
4. **LOW/INFO** → Logging pour analyse tendances

---

## 🔧 **Personnalisation**

### Seuils Personnalisés
Éditer `.security-thresholds` :
```bash
# Environnement production - seuils stricts
MAX_FAILED_OPERATIONS=3
MAX_DEBUG_ACTIVATIONS=1
ALERT_TIME_WINDOW=1800  # 30 minutes

# Environnement développement - seuils relâchés
MAX_FAILED_OPERATIONS=10
MAX_DEBUG_ACTIVATIONS=5
ALERT_TIME_WINDOW=7200  # 2 heures
```

### Intégration CI/CD
Workflow GitHub Actions personnalisé :
```yaml
# .github/workflows/custom-security.yml
- name: Security Scan
  run: |
    npm run security:scan
    npm run security:status
    
- name: Fail on Critical Issues
  run: |
    CRITICAL=$(grep -c '"severity":"CRITICAL"' logs/security-events.log || echo "0")
    if [ "$CRITICAL" -gt 0 ]; then
      echo "❌ Critical security issues found!"
      exit 1
    fi
```

### Intégration Monitoring Externe
```bash
# Export métriques pour SIEM
cat metrics/security-$(date +%Y%m%d).json | \
  jq '.security_metrics' | \
  curl -X POST -H "Content-Type: application/json" \
  -d @- https://your-siem-endpoint.com/api/metrics
```

---

## 📋 **Maintenance**

### Nettoyage Automatique
```bash
# Nettoyage logs anciens (configuré dans .security-thresholds)
find logs/ -name "*.log" -mtime +${SECURITY_LOG_RETENTION_DAYS:-30} -delete

# Nettoyage métriques anciennes
find metrics/ -name "security-*.json" -mtime +90 -delete
```

### Monitoring Performance
```bash
# Vérifier impact performance monitoring
time npm run security:scan

# Surveiller utilisation disque
du -sh logs/ metrics/
```

### Backup Sécurité
```bash
# Backup configuration
cp .security-thresholds .security-thresholds.backup

# Backup logs critiques
tar -czf security-backup-$(date +%Y%m%d).tar.gz logs/ metrics/
```

---

## 🆘 **Troubleshooting**

### Problèmes Courants

#### Monitoring ne démarre pas
```bash
# Vérifier permissions
ls -la scripts/security-monitor.sh

# Réinitialiser
npm run security:init
```

#### Dashboard vide
```bash
# Générer métriques manuellement
npm run security:metrics

# Vérifier métriques
ls -la metrics/security-*.json
```

#### Alertes trop fréquentes
```bash
# Ajuster seuils
edit .security-thresholds

# Redémarrer monitoring
pkill -f security-monitor
npm run security:monitor &
```

### Support
- **Logs détaillés** : `logs/security-readable.log`
- **Métriques JSON** : `metrics/security-YYYYMMDD.json`
- **Configuration** : `.security-thresholds`

---

## 🎯 **Best Practices**

### Sécurité Opérationnelle
1. **Monitoring Continu** : Laisser `security:monitor` en arrière-plan
2. **Review Quotidienne** : Consulter dashboard chaque matin
3. **Seuils Adaptés** : Ajuster selon environnement (dev/prod)
4. **Backup Régulier** : Sauvegarder logs et configuration

### Performance
1. **Rotation Logs** : Configurer retention appropriée
2. **Monitoring Léger** : Éviter over-monitoring en développement
3. **Métriques Ciblées** : Focus sur événements critiques
4. **Dashboard Optimisé** : Refresh adapté à l'usage

### Compliance
1. **Audit Trail** : Conserver logs pour audits
2. **Documentation** : Maintenir procédures à jour
3. **Formation** : S'assurer équipe connaît alertes
4. **Tests Réguliers** : Valider système d'alerte

---

**🔐 Security Monitoring v1.0**  
**Compatible** : Claude Starter Kit v4.1+  
**Status** : Production Ready ✅  

**Voir aussi** : `CLAUDE-ERRORS.md` | `CLAUDE-VALIDATION.md`