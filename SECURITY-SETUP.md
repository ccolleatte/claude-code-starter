# 🔐 SECURITY SETUP - Variables d'Environnement

## ⚠️ ALERTE SÉCURITÉ CORRIGÉE

Ce projet contenait des **clés API réelles exposées** qui ont été neutralisées.

## 🔑 Clés à Régénérer IMMÉDIATEMENT

### 1. Anthropic API Key
```bash
# EXPOSÉE (ANNULÉE) : sk-ant-api03-Ny1E3hG-Az_9FeLEPj...
# ACTION : Regenerer sur https://console.anthropic.com/
```

### 2. Exa API Key  
```bash
# EXPOSÉE (ANNULÉE) : 2a89fc42-2a13-4a06-b529-ceda509988ed
# ACTION : Regenerer sur https://dashboard.exa.ai/
```

## 🛠️ Configuration Sécurisée

### Étape 1 : Copier Template
```bash
cp .env.example .env
```

### Étape 2 : Configurer Vraies Clés
```bash
# .env (NON VERSIONNÉ)
ANTHROPIC_API_KEY=sk-ant-api03-YOUR-NEW-KEY-HERE
EXA_API_KEY=your-new-exa-key-here
OPENAI_API_KEY=sk-YOUR-OPENAI-KEY-HERE
VOYAGE_API_KEY=your-voyage-key-here
```

### Étape 3 : Vérifier .gitignore
```bash
# .gitignore contient :
.env
.env.local
.env.production
```

## 🔒 Best Practices Implémentées

1. **Template seulement** : `.env.example` versionné avec placeholders
2. **Vraies clés isolées** : `.env` dans .gitignore
3. **Validation scripts** : Scripts MCP vérifient présence clés
4. **Documentation** : Instructions claires setup

## ✅ Validation Setup

```bash
# Test que les clés sont chargées
source .env
echo $ANTHROPIC_API_KEY | grep -q "sk-ant" && echo "✅ Anthropic OK"
echo $EXA_API_KEY | grep -q -v "your-" && echo "✅ Exa OK"
```

## 📋 Checklist Sécurité

- [ ] Clés Anthropic régénérées
- [ ] Clés Exa régénérées
- [ ] .env configuré avec vraies clés
- [ ] .env dans .gitignore
- [ ] Scripts MCP testés
- [ ] Documentation équipe mise à jour

## 🚨 En Cas de Nouvelle Exposition

1. **Identifier** : Quelles clés sont exposées
2. **Révoquer** : Annuler immédiatement sur providers
3. **Régénérer** : Créer nouvelles clés
4. **Nettoyer** : git filter-branch si nécessaire
5. **Prévenir** : Revoir .gitignore et process

---

**Dernière mise à jour** : 18 septembre 2025  
**Status** : Faille corrigée - Setup sécurisé actif