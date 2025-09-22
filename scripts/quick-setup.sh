#!/bin/bash
set -e

echo "🚀 Claude Code Starter Kit - Setup Rapide"
echo "========================================"

# Vérifier Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js requis. Installer Node.js ≥16.0.0"
    exit 1
fi

# Vérifier version Node
NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 16 ]; then
    echo "❌ Node.js ≥16.0.0 requis. Version actuelle: $(node --version)"
    exit 1
fi

echo "✅ Node.js $(node --version) détecté"

# Créer .env depuis template
if [ ! -f .env ]; then
    if [ -f .env.template ]; then
        cp .env.template .env
        echo "✅ Fichier .env créé depuis template"
    else
        echo "❌ Fichier .env.template manquant"
        exit 1
    fi
else
    echo "✅ Fichier .env existe déjà"
fi

# Vérifier configuration MCP
if [ ! -f .claude/mcp.json ]; then
    echo "❌ Configuration MCP manquante (.claude/mcp.json)"
    exit 1
else
    echo "✅ Configuration MCP présente"
fi

# Test environnement
echo ""
echo "🔍 Vérification environnement..."
npm run check:env

echo ""
echo "🎯 Setup terminé !"
echo "📝 Étapes suivantes :"
echo "   1. Éditez .env avec vos vraies clés API"
echo "   2. Lancez: npm run validate:setup"
echo "   3. Testez: npm test"