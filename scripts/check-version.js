#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const packageJson = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../package.json'), 'utf-8')
);

const tagVersion = process.env.GITHUB_REF_NAME || '';

if (tagVersion.startsWith('v')) {
  const expectedVersion = tagVersion.slice(1);
  if (packageJson.version !== expectedVersion) {
    console.error(
      `Version mismatch: tag is ${tagVersion} but package.json is ${packageJson.version}`
    );
    process.exit(1);
  }
  console.log(`Version check passed: ${packageJson.version}`);
} else {
  console.log('Not a version tag, skipping check');
}
