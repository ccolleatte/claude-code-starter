#!/bin/bash
set -e

echo "🔍 Claude Code Starter Kit - Validation Setup"
echo "============================================="

ERRORS=0

# Test 1: Node.js
echo "1. Vérification Node.js..."
if command -v node &> /dev/null; then
    echo "   ✅ Node.js $(node --version)"
else
    echo "   ❌ Node.js non installé"
    ERRORS=$((ERRORS + 1))
fi

# Test 2: Fichier .env
echo "2. Vérification .env..."
if [ -f .env ]; then
    echo "   ✅ Fichier .env présent"
    
    # Test clés API
    KEYS_COUNT=$(grep -c "^[A-Z].*=.*-" .env 2>/dev/null || echo "0")
    if [ "$KEYS_COUNT" -gt 0 ]; then
        echo "   ✅ $KEYS_COUNT clé(s) API configurée(s)"
    else
        echo "   ⚠️  Aucune clé API détectée dans .env"
        ERRORS=$((ERRORS + 1))
    fi
else
    echo "   ❌ Fichier .env manquant"
    ERRORS=$((ERRORS + 1))
fi

# Test 3: Configuration MCP
echo "3. Vérification MCP..."
if [ -f .claude/mcp.json ]; then
    MCP_SERVERS=$(grep -c "\"type\": \"stdio\"" .claude/mcp.json 2>/dev/null || echo "0")
    echo "   ✅ Configuration MCP présente ($MCP_SERVERS serveurs)"
else
    echo "   ❌ Configuration MCP manquante"
    ERRORS=$((ERRORS + 1))
fi

# Test 4: Scripts MCP
echo "4. Vérification scripts MCP..."
MCP_SCRIPTS=0
for script in .claude/scripts/*-mcp.sh; do
    if [ -f "$script" ]; then
        MCP_SCRIPTS=$((MCP_SCRIPTS + 1))
    fi
done
echo "   ✅ $MCP_SCRIPTS script(s) MCP disponible(s)"

# Test 5: Tests projet
echo "5. Vérification tests..."
if npm test > /dev/null 2>&1; then
    echo "   ✅ Tests passent"
else
    echo "   ❌ Tests échouent"
    ERRORS=$((ERRORS + 1))
fi

# Test 6: Cipher (si clés présentes)
echo "6. Test Cipher MCP..."
if grep -q "sk-" .env 2>/dev/null; then
    if npx @byterover/cipher "test setup" > /dev/null 2>&1; then
        echo "   ✅ Cipher opérationnel"
    else
        echo "   ⚠️  Cipher non opérationnel (vérifiez clés API)"
        ERRORS=$((ERRORS + 1))
    fi
else
    echo "   ⚠️  Cipher non testé (clés API manquantes)"
fi

# Résultat final
echo ""
echo "=========================================="
if [ $ERRORS -eq 0 ]; then
    echo "🎉 SETUP COMPLET - Kit prêt à l'emploi !"
    echo ""
    echo "🚀 Commandes utiles :"
    echo "   npm test              # Tests complets"
    echo "   npm run test:quick    # Tests rapides"
    echo "   npm run security:scan # Scan sécurité"
    exit 0
else
    echo "❌ SETUP INCOMPLET - $ERRORS erreur(s) détectée(s)"
    echo ""
    echo "🔧 Actions correctives :"
    echo "   1. Vérifiez vos clés API dans .env"
    echo "   2. Relancez: npm run validate:setup"
    exit 1
fi