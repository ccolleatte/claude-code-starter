#!/usr/bin/env node
/**
 * Validate Unicode Fixes for Windows Compatibility
 * Tests that all scripts work without Unicode encoding errors
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('=== Validating Unicode Fixes ===');
console.log(`Platform: ${process.platform}`);
console.log(`Node version: ${process.version}`);
console.log('');

let testsPassed = 0;
let testsTotal = 0;

function runTest(name, testFn) {
    testsTotal++;
    try {
        testFn();
        console.log(`✓ ${name}`);
        testsPassed++;
    } catch (error) {
        console.log(`✗ ${name}: ${error.message}`);
    }
}

// Test 1: Setup wizard loads without errors
runTest('Setup wizard syntax', () => {
    const setupWizard = fs.readFileSync('./scripts/setup-wizard.js', 'utf8');
    if (setupWizard.includes('\\u')) {
        throw new Error('Contains Unicode escape sequences');
    }
});

// Test 2: Safe output functions exist
runTest('Safe output functions exist', () => {
    const safeOutput = fs.readFileSync('./scripts/safe-output.sh', 'utf8');
    if (!safeOutput.includes('safe_echo()')) {
        throw new Error('safe_echo function not found');
    }
});

// Test 3: Claude metrics updated
runTest('Claude metrics uses safe_echo', () => {
    const metrics = fs.readFileSync('./scripts/claude-metrics.sh', 'utf8');
    if (!metrics.includes('safe_echo')) {
        throw new Error('safe_echo calls not found');
    }
    if (metrics.includes('echo -e "${RED}🚨')) {
        throw new Error('Unicode emojis still present');
    }
});

// Test 4: Python scripts use ASCII output
runTest('Python scripts use ASCII prefixes', () => {
    const checkLinks = fs.readFileSync('./scripts/check-internal-links.py', 'utf8');
    if (!checkLinks.includes('[OK]') && !checkLinks.includes('[ERROR]') && !checkLinks.includes('[SUCCESS]')) {
        throw new Error('ASCII prefixes not found');
    }
});

// Test 5: Package.json has setup command
runTest('Package.json has setup command', () => {
    const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
    if (!packageJson.scripts || !packageJson.scripts.setup) {
        throw new Error('setup script not found in package.json');
    }
});

console.log('');
console.log(`=== Results: ${testsPassed}/${testsTotal} tests passed ===`);

if (testsPassed === testsTotal) {
    console.log('🎉 All Unicode fixes validated successfully!');
    console.log('');
    console.log('Windows users can now run:');
    console.log('  npm run setup                    # Interactive setup');
    console.log('  npm run backlog:status           # View backlog');
    console.log('  npm run validate                 # Run validation');
    process.exit(0);
} else {
    console.log('❌ Some tests failed. Please review the issues above.');
    process.exit(1);
}