#!/bin/bash
set -e

echo "ðŸš€ Claude Code Starter Kit - Setup Rapide"
echo "========================================"

# VÃ©rifier Node.js
if ! command -v node &> /dev/null; then
    echo "âŒ Node.js requis. Installer Node.js â‰¥16.0.0"
    exit 1
fi

# VÃ©rifier version Node
NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 16 ]; then
    echo "âŒ Node.js â‰¥16.0.0 requis. Version actuelle: $(node --version)"
    exit 1
fi

echo "âœ… Node.js $(node --version) dÃ©tectÃ©"

# CrÃ©er .env depuis template
if [ ! -f .env ]; then
    if [ -f .env.template ]; then
        cp .env.template .env
        echo "âœ… Fichier .env crÃ©Ã© depuis template"
    else
        echo "âŒ Fichier .env.template manquant"
        exit 1
    fi
else
    echo "âœ… Fichier .env existe dÃ©jÃ "
fi

# VÃ©rifier configuration MCP
if [ ! -f .claude/mcp.json ]; then
    echo "âŒ Configuration MCP manquante (.claude/mcp.json)"
    exit 1
else
    echo "âœ… Configuration MCP prÃ©sente"
fi

# Test environnement
echo ""
echo "ðŸ” VÃ©rification environnement..."
npm run check:env

echo ""
echo "ðŸŽ¯ Setup terminÃ© !"
echo "ðŸ“ Ã‰tapes suivantes :"
echo "   1. Ã‰ditez .env avec vos vraies clÃ©s API"
echo "   2. Lancez: npm run validate:setup"
echo "   3. Testez: npm test"
