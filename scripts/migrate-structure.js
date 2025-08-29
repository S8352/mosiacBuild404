#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🚀 Starting Job Copilot structure migration...');

// Create new directories
const directories = [
  'extension/src/js',
  'extension/src/css',
  'extension/src/utils',
  'extension/assets',
  'shared/types',
  'shared/utils',
  'docs',
  'deploy/docker',
  'deploy/kubernetes'
];

directories.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`✅ Created directory: ${dir}`);
  }
});

// Move files
const fileMoves = [
  { from: 'manifest.json', to: 'extension/manifest.json' },
  { from: 'background.js', to: 'extension/background.js' },
  { from: 'content.js', to: 'extension/content.js' },
  { from: 'injected.js', to: 'extension/injected.js' },
  { from: 'popup.html', to: 'extension/popup.html' },
  { from: 'popup.js', to: 'extension/popup.js' },
  { from: 'onboarding.html', to: 'extension/onboarding.html' },
  { from: 'test-feedback.html', to: 'extension/test-feedback.html' },
  { from: 'index.html', to: 'extension/index.html' },
  { from: 'icons', to: 'extension/assets/icons' },
  { from: 'src', to: 'extension/src' },
  { from: 'backend', to: 'backend-service' },
  { from: 'memory-bank', to: 'shared/memory-bank' },
  { from: 'tests', to: 'shared/tests' },
  { from: 'docker-compose.yml', to: 'deploy/docker/docker-compose.yml' },
  { from: '.gitignore', to: 'deploy/.gitignore' }
];

fileMoves.forEach(move => {
  if (fs.existsSync(move.from)) {
    if (fs.existsSync(move.to)) {
      console.log(`⚠️  Skipping ${move.from} - ${move.to} already exists`);
    } else {
      fs.renameSync(move.from, move.to);
      console.log(`✅ Moved ${move.from} to ${move.to}`);
    }
  } else {
    console.log(`⚠️  File not found: ${move.from}`);
  }
});

console.log('🎉 Migration completed!');
console.log('\n📋 Next steps:');
console.log('1. Review the new structure');
console.log('2. Update any import paths in your code');
console.log('3. Test the extension and backend');
console.log('4. Update your deployment scripts');
