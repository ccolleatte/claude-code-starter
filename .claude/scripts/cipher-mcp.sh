#!/bin/bash
# cipher-mcp.sh - Wrapper pour Cipher MCP Server

set -e

# Configuration
export ANTHROPIC_API_KEY="${ANTHROPIC_API_KEY:-your-key}"
export VOYAGE_API_KEY="${VOYAGE_API_KEY:-your-key}"
export CIPHER_WORKSPACE="${CIPHER_WORKSPACE:-$HOME/.cipher/workspace}"

# Vérifier installation
if ! command -v cipher &> /dev/null; then
    echo "Error: cipher not installed" >&2
    echo "Install with: npm install -g @byterover/cipher" >&2
    exit 1
fi

# Lancer Cipher
exec npx @byterover/cipher serve --workspace "$CIPHER_WORKSPACE"