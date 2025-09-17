# 🔄 Cipher Auto-Activation - Template v2.1

## ✅ **Garantie: Cipher Actif au Redémarrage**

Le template v2.1 assure que **Cipher sera automatiquement actif** quand Claude Code redémarre, **sans intervention manuelle**.

## 🛠️ **Mécanismes d'Auto-Activation**

### **1. MCP Configuration Robuste**
```json
// .claude/mcp.json généré automatiquement
{
  "cipher": {
    "type": "stdio",
    "command": "npx",
    "args": ["@byterover/cipher", "--mode", "mcp"],
    "env": {
      "CIPHER_AUTO_INIT": "true",
      "CIPHER_FALLBACK_MODE": "true"
    },
    "timeout": 10000,
    "retries": 3
  }
}
```

### **2. Permissions Pré-Chargées**
```json
// .claude/settings.local.json incluant TOUTES les permissions Cipher
{
  "permissions": {
    "allow": [
      "mcp__cipher__*",              // Toutes fonctions Cipher MCP
      "Bash(npx @byterover/cipher:*)", // CLI Cipher
      "Bash(cipher:*)",              // Commandes Cipher
      "Read(//c/dev/.cipher/**)",    // Lecture workspace Cipher
      "Write(//c/dev/.cipher/**)"    // Écriture workspace Cipher
    ]
  }
}
```

### **3. Stratégie de Fallback**
```javascript
// Si Cipher MCP échoue → Fallback automatique vers implémentation locale
{
  "fallback_config": {
    "local_implementation": "src/scripts/cipher-memory-system.js",
    "auto_switch": true,
    "graceful_degradation": true
  }
}
```

## 🎯 **Scénarios d'Activation**

### **Scénario 1: Cipher MCP Fonctionne**
```
Claude Code redémarre
→ Lit .claude/mcp.json
→ Lance npx @byterover/cipher --mode mcp
→ ✅ Cipher MCP actif
→ Toutes fonctions disponibles
```

### **Scénario 2: Cipher MCP Échoue**
```
Claude Code redémarre
→ Lit .claude/mcp.json
→ Lance npx @byterover/cipher --mode mcp
→ ❌ Échec après 3 tentatives
→ 🔄 Fallback vers src/scripts/cipher-memory-system.js
→ ✅ Cipher local actif
```

### **Scénario 3: Aucun Cipher Disponible**
```
Claude Code redémarre
→ Cipher MCP échoue
→ Cipher local absent
→ ⚠️ Mode dégradé (sans mémoire persistante)
→ Autres MCP (Serena, Semgrep, Exa) restent actifs
```

## 🔧 **Configuration Template v2.1**

### **Fichiers Générés Automatiquement**
1. **`.claude/mcp.json`** - Configuration MCP avec auto-retry
2. **`.claude/settings.local.json`** - Permissions complètes pré-chargées
3. **`.claude/hooks.json`** - Hooks post-édition activés
4. **`src/scripts/cipher-memory-system.js`** - Fallback local

### **Variables de Configuration**
```yaml
# config-ultimate.yml
cipher_auto_activation:
  enabled: true
  timeout: 10000
  retries: 3
  fallback_mode: true
  permissions_preloaded: true
```

## ✅ **Tests de Validation**

### **Test 1: Redémarrage Normal**
```bash
# Claude Code fermé/rouvert
# Cipher doit être immédiatement disponible
mcp__cipher__list_memories  # Doit fonctionner
```

### **Test 2: Cipher Indisponible**
```bash
# Simuler échec Cipher MCP
# Fallback local doit s'activer
cipher status  # Doit montrer "local mode"
```

### **Test 3: Permissions Complètes**
```bash
# Toutes permissions Cipher disponibles
Bash(cipher:*)              # Autorisé
Read(//c/dev/.cipher/**)     # Autorisé
Write(//c/dev/.cipher/**)    # Autorisé
```

## 🎯 **Résultat Garanti**

Avec le template v2.1:

1. ✅ **Cipher actif automatiquement** au redémarrage Claude Code
2. ✅ **Aucune configuration manuelle** requise
3. ✅ **Fallback intelligent** si problème MCP
4. ✅ **Permissions complètes** pré-chargées
5. ✅ **Zero maintenance** après déploiement initial

**Promesse**: Tu redémarres Claude Code → Cipher fonctionne immédiatement ! 🚀