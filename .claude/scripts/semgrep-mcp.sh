#!/bin/bash
# semgrep-mcp.sh - Wrapper pour Semgrep MCP Server

set -e

# Configuration
SEMGREP_CONFIG="${SEMGREP_CONFIG:-auto}"
SEMGREP_RULES="${SEMGREP_RULES:-p/security-audit,p/secrets,p/owasp-top-10}"

# Vérifier installation
if ! command -v semgrep &> /dev/null; then
    echo "Error: semgrep not installed" >&2
    echo "Install with: pip install semgrep" >&2
    exit 1
fi

# Vérifier MCP server
if ! command -v npx &> /dev/null; then
    echo "Error: npx not installed" >&2
    echo "Install Node.js and npm first" >&2
    exit 1
fi

# Lancer Semgrep MCP Server (read-only)
exec npx @anthropic-ai/mcp-semgrep serve --rules "$SEMGREP_RULES" --config "$SEMGREP_CONFIG" --read-only