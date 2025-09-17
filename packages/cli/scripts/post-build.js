#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 Running post-build tasks...');

// Ensure the binary is executable on Unix systems
const binPath = path.join(__dirname, '..', 'dist', 'bin', 'claude-stack.js');
if (fs.existsSync(binPath)) {
  try {
    fs.chmodSync(binPath, '755');
    console.log('✅ Made binary executable');
  } catch (error) {
    console.warn('⚠️  Could not make binary executable:', error.message);
  }
}

// Copy additional assets if they exist
const assetsToCopy = [
  { src: 'templates', dest: 'dist/templates' },
  { src: 'profiles', dest: 'dist/profiles' }
];

assetsToCopy.forEach(({ src, dest }) => {
  const srcPath = path.join(__dirname, '..', src);
  const destPath = path.join(__dirname, '..', dest);

  if (fs.existsSync(srcPath)) {
    try {
      // Create destination directory
      if (!fs.existsSync(destPath)) {
        fs.mkdirSync(destPath, { recursive: true });
      }

      // Copy files recursively
      copyRecursive(srcPath, destPath);
      console.log(`✅ Copied ${src} to ${dest}`);
    } catch (error) {
      console.warn(`⚠️  Could not copy ${src}:`, error.message);
    }
  }
});

console.log('✅ Post-build tasks completed');

function copyRecursive(src, dest) {
  const stats = fs.statSync(src);

  if (stats.isDirectory()) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }

    const files = fs.readdirSync(src);
    files.forEach(file => {
      const srcFile = path.join(src, file);
      const destFile = path.join(dest, file);
      copyRecursive(srcFile, destFile);
    });
  } else {
    fs.copyFileSync(src, dest);
  }
}