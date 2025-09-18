#!/bin/bash
# serena-mcp.sh - Wrapper pour Serena MCP Server

set -e

# Configuration
SERENA_PORT="${SERENA_PORT:-3001}"
SERENA_CONFIG="${SERENA_CONFIG:-$PWD/.serena/project.yml}"

# Vérifier installation
if ! command -v npx &> /dev/null; then
    echo "Error: npx not installed" >&2
    echo "Install Node.js and npm first" >&2
    exit 1
fi

# Vérifier configuration Serena
if [ ! -f "$SERENA_CONFIG" ]; then
    echo "Error: Serena config not found at $SERENA_CONFIG" >&2
    echo "Run: npx @anthropic-ai/mcp-serena init" >&2
    exit 1
fi

# Lancer Serena MCP Server
exec npx @anthropic-ai/mcp-serena serve --config "$SERENA_CONFIG" --port "$SERENA_PORT"