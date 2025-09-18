# Guide de Surveillance du Framework Claude

## 🎯 Vue d'Ensemble

Système de surveillance complet pour le framework Claude v4.1, suivant les performances, la qualité, et les métriques anti-hallucination pour maintenir des standards de niveau doctoral.

## 📊 Indicateurs Clés de Performance (KPIs)

### 🚨 Métriques Critiques (P0)

| Métrique | Cible | Seuil d'Alerte | Impact |
|----------|-------|----------------|---------|
| **Hallucinations Quotidiennes** | 0 | ≥ 3 | Fiabilité framework |
| **Erreurs Configuration** | 0 | ≥ 1 | Stabilité système |
| **Violations Sécurité** | 0 | ≥ 1 | Protection données |
| **Échecs Tests** | 0% | ≥ 5% | Qualité code |

### ⚡ Métriques Performance (P1)

| Métrique | Cible | Seuil d'Alerte | Impact |
|----------|-------|----------------|---------|
| **Temps de Réponse** | < 2s | ≥ 5s | Expérience utilisateur |
| **Temps Chargement Config** | < 100ms | ≥ 200ms | Performance démarrage |
| **Usage Mémoire** | < 50MB | ≥ 100MB | Efficacité ressources |
| **Hit Rate Cache Template** | > 90% | < 80% | Vitesse réponse |

### 📈 Métriques Qualité (P2)

| Métrique | Cible | Seuil d'Alerte | Impact |
|----------|-------|----------------|---------|
| **Couverture Tests** | > 90% | < 85% | Fiabilité code |
| **Couverture Documentation** | > 95% | < 90% | Maintenabilité |
| **Taux Usage Templates** | > 80% | < 60% | Adoption framework |
| **Taux Récupération Erreurs** | > 95% | < 90% | Résilience |

## 🔔 Règles d'Alertes

### Niveaux de Gravité

#### 🔴 CRITIQUE (P0) - Réponse Immédiate Requise
```bash
# Déclencheurs
- Hallucinations >= 3/jour
- Violations sécurité détectées
- Erreurs config empêchant démarrage
- Taux échec suite tests >= 10%

# Actions
- Notification instantanée (SMS/Slack)
- Auto-rollback si possible
- Création rapport incident
- Notification lead developer
```

#### 🟡 AVERTISSEMENT (P1) - Réponse Sous 2 Heures
```bash
# Déclencheurs  
- Temps réponse >= 5s soutenu
- Usage mémoire >= 100MB
- Erreurs templates >= 5/heure
- Chute coverage >= 5%

# Actions
- Notification email
- Analyse performance
- Surveillance ressources
- Planification optimisation
```

#### 🔵 INFO (P2) - Revue Quotidienne
```bash
# Déclencheurs
- Anomalies patterns usage
- Dégradation performance < 20%
- Gaps documentation
- Avertissements config mineurs

# Actions
- Inclusion rapport quotidien
- Analyse tendances
- Suggestions optimisation
- Mises à jour documentation
```

### Configuration des Alertes

#### Détection Hallucinations
```bash
# Types suivis
- Invention de fonctions
- Création fichiers sans analyse
- Suppositions imports
- Tests faux positifs
- Hallucinations configuration

# Déclencheurs automatiques
scripts/claude-metrics.sh hallucination function_invention high "invented calculateScore()"
```

#### Surveillance Performance
```bash
# Suivi temps de réponse
start_time=$(date +%s.%3N)
# ... opération ...
scripts/claude-metrics.sh response-time "file_search" "$start_time"

# Surveillance mémoire
memory_usage=$(ps -o pid,vsz,rss,comm -p $$ | awk 'NR==2{print $2}')
if [ "$memory_usage" -gt 100000 ]; then
    scripts/claude-metrics.sh config-error memory system "Usage: ${memory_usage}KB"
fi
```

## 📊 Configuration Tableau de Bord

### Surveillance Temps Réel
```bash
# Tableau de bord live (mise à jour toutes les 30s)
watch -n 30 'scripts/claude-metrics.sh dashboard 1'

# Tendances horaires
scripts/claude-metrics.sh dashboard 24

# Résumé hebdomadaire
for day in {0..6}; do
    date_str=$(date -d "$day days ago" +%Y-%m-%d)
    scripts/claude-metrics.sh report "$date_str"
done
```

### Intégration Grafana (Optionnel)
```yaml
# grafana-config.yml
datasources:
  - name: claude-metrics
    type: json
    url: file://.claude/metrics/daily-$(date +%Y%m%d).json

dashboards:
  claude-framework:
    panels:
      - title: "Hallucinations/Jour"
        type: stat
        targets: ["metrics.hallucinations.count"]
      - title: "Tendance Temps Réponse"
        type: graph
        targets: ["metrics.response_time.average"]
      - title: "Usage Templates"
        type: pie
        targets: ["metrics.template_usage.total"]
```

### Tableau de Bord HTML Personnalisé
```html
<!-- .claude/metrics/dashboard.html -->
<!DOCTYPE html>
<html>
<head>
    <title>Tableau de Bord Framework Claude</title>
    <meta http-equiv="refresh" content="30">
</head>
<body>
    <h1>Surveillance Claude v4.1</h1>
    <div id="metrics">
        <!-- Auto-rempli par scripts/claude-dashboard.js -->
    </div>
    <script src="claude-dashboard.js"></script>
</body>
</html>
```

## 📈 Analyse de Tendances

### Patterns Quotidiens
```bash
# Identifier heures de pointe
awk -F'|' '{
    hour=substr($1,12,2); 
    count[hour]++
} END {
    for(h in count) print h ":00 - " count[h] " opérations"
}' .claude/metrics/claude-metrics.log

# Patterns hallucinations par heure
grep "hallucination" .claude/metrics/claude-metrics.log | \
awk -F'|' '{hour=substr($1,12,2); print hour}' | \
sort | uniq -c | sort -nr
```

### Rapports Hebdomadaires/Mensuels
```bash
# Agrégation hebdomadaire
for week in {0..3}; do
    start_date=$(date -d "$((week*7)) days ago" +%Y-%m-%d)
    end_date=$(date -d "$(((week*7)-6)) days ago" +%Y-%m-%d)
    echo "Semaine $week ($start_date à $end_date):"
    awk -F'|' -v start="$start_date" -v end="$end_date" \
        '$1 >= start && $1 <= end' .claude/metrics/claude-metrics.log | \
        wc -l
done
```

## 🛠️ Guides Opérationnels de Dépannage

### Taux Élevé d'Hallucinations
```bash
# Étapes d'investigation
1. Vérifier changements récents: git log --oneline -10
2. Analyser patterns: grep "hallucination" .claude/metrics/claude-metrics.log | tail -10
3. Réviser contexte: Vérifier fichiers/opérations spécifiques avec problèmes
4. Rollback si nécessaire: git reset --hard HEAD~1
5. Mettre à jour règles validation

# Prévention
- Augmenter rigueur validation
- Ajouter hooks pre-commit
- Réviser exemples formation
```

### Dégradation Performance
```bash
# Diagnostic
1. Vérifier usage mémoire: scripts/claude-metrics.sh dashboard 1
2. Profiler opérations: chronométrer opérations individuellement
3. Analyser logs: grep "response_time" .claude/metrics/claude-metrics.log | tail -20
4. Vérifier ressources système: top, iostat

# Optimisation
- Mettre en cache configs fréquemment utilisées
- Optimiser chargement templates
- Réduire opérations I/O fichiers
- Mettre à jour matériel si nécessaire
```

### Erreurs Configuration
```bash
# Processus de récupération
1. Valider syntaxe: python -m pytest tests/claude/test_templates_syntax.py
2. Vérifier environnement: npm run check:env
3. Vérifier structure: npm run validate:structure
4. Réinitialiser au dernier bon état: git checkout HEAD -- .claude/
5. Réappliquer changements avec précaution

# Prévention
- Utiliser scripts validation avant commits
- Implémenter validation schéma
- Sauvegarde régulière configs fonctionnelles
```

## 📋 Calendrier de Maintenance

### Quotidien (Automatisé)
- [ ] Générer rapport métriques quotidien
- [ ] Vérifier seuils alertes
- [ ] Valider intégrité configuration
- [ ] Mettre à jour baselines performance

### Hebdomadaire (Revue Manuelle)
- [ ] Analyser patterns tendances
- [ ] Réviser précision alertes
- [ ] Mettre à jour seuils si nécessaire
- [ ] Revue optimisation performance

### Mensuel (Stratégique)
- [ ] Évaluation santé framework
- [ ] Ajustement cibles KPI
- [ ] Mises à jour outils surveillance
- [ ] Affinement données formation

## 🔧 Intégration Outils

### Intégration CI/CD
```yaml
# Ajouter à .github/workflows/claude-validation.yml
- name: Collecte métriques
  run: |
    scripts/claude-metrics.sh response-time "ci_pipeline" "$START_TIME"
    scripts/claude-metrics.sh template "CLAUDE.md" "validation" "true"
```

### Intégration IDE
```bash
# VS Code task.json
{
    "label": "Tableau de Bord Métriques Claude",
    "type": "shell",
    "command": "scripts/claude-metrics.sh dashboard 24"
}
```

### Webhooks Slack/Discord
```bash
# .claude/hooks/alert.sh
#!/bin/bash
WEBHOOK_URL="${SLACK_WEBHOOK_URL}"
curl -X POST -H 'Content-type: application/json' \
  --data "{\"text\":\"🚨 Alerte Claude: $1 - $2\"}" \
  "$WEBHOOK_URL"
```

## 📊 Requêtes Exemples

### Top Types Hallucinations
```bash
grep "hallucination" .claude/metrics/claude-metrics.log | \
cut -d'|' -f4 | cut -d':' -f1 | sort | uniq -c | sort -nr
```

### Performance par Opération
```bash
grep "response_time" .claude/metrics/claude-metrics.log | \
awk -F'|' '{print $4, $3}' | sort | \
awk '{op=$1; time=$2; count[op]++; sum[op]+=time} END {
    for(o in count) printf "%-20s %6.3fs (%d ops)\n", o, sum[o]/count[o], count[o]
}'
```

### Taux Succès Templates
```bash
grep "template_usage" .claude/metrics/claude-metrics.log | \
awk -F'|' '{
    template=split($4,parts,":")[1]; 
    success=$3; 
    total[template]++; 
    if(success=="true") ok[template]++
} END {
    for(t in total) printf "%-30s %6.1f%% (%d/%d)\n", 
                           t, (ok[t]/total[t])*100, ok[t], total[t]
}'
```

---
**Version** : 1.0.0  
**Fréquence Mise à Jour** : Surveillance temps réel, rapports quotidiens  
**Rétention** : 30 jours détaillés, 1 an agrégés  
**Contact** : Équipe framework pour ajustements seuils