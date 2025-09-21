#!/usr/bin/env node

/**
 * Claude Code Starter Kit v4.1
 * Main entry point for npm package
 */

const fs = require('fs');
const path = require('path');

function showWelcome() {
  console.log(`
🤖 Claude Code Starter Kit v4.1

Welcome to the Claude Code Configuration Framework!

🚀 Quick Start:
  1. Copy configuration files to your project
  2. Set up environment variables
  3. Run validation tests

📖 Documentation: https://github.com/ccolleatte/claude-code-starter

📁 Files included:
  - .claude/ (Core configuration)
  - scripts/ (Utilities)
  - tests/ (Test suite)
  - docs/ (Documentation)

For setup help, run: npm run setup
For validation: npm run validate
  `);
}

// Main execution
if (require.main === module) {
  showWelcome();
}

module.exports = {
  version: require('./package.json').version,
  showWelcome
};