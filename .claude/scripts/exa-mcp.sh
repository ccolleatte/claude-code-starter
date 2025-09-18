#!/bin/bash
# exa-mcp.sh - Wrapper pour Exa MCP Server

set -e

# Configuration
EXA_API_KEY="${EXA_API_KEY:-your-exa-api-key}"
EXA_PORT="${EXA_PORT:-3003}"

# Vérifier clé API (load from .env if available)
if [ -f ".env" ]; then
    source .env
fi

if [ -z "$EXA_API_KEY" ] || [ "$EXA_API_KEY" = "your-exa-api-key" ]; then
    echo "Error: EXA_API_KEY not configured" >&2
    echo "Configure in .env file or export EXA_API_KEY=your-key" >&2
    exit 1
fi

# Vérifier installation
if ! command -v npx &> /dev/null; then
    echo "Error: npx not installed" >&2
    echo "Install Node.js and npm first" >&2
    exit 1
fi

# Lancer Exa MCP Server (read-only web search)
exec npx @anthropic-ai/mcp-exa serve --api-key "$EXA_API_KEY" --port "$EXA_PORT" --read-only