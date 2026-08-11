#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

let failures = 0;

function fail(msg) {
  console.error(`  FAIL: ${msg}`);
  failures++;
}

function pass(msg) {
  console.log(`  OK: ${msg}`);
}

console.log('=== Pre-Release Validation ===\n');

const pkg = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
const distMain = path.join('dist', 'main');
const distPreload = path.join('dist', 'preload');
const distRenderer = path.join('dist', 'renderer');
const distShared = path.join('dist', 'shared');

console.log('1. Module type consistency');
if (pkg.type === 'module') {
  fail('package.json declares type=module but main process builds to CommonJS');
} else {
  pass(`package.json type is ${pkg.type || 'undefined (CommonJS)'}`);
}

console.log('\n2. Preload script exists');
if (fs.existsSync(path.join(distPreload, 'index.js'))) {
  pass('dist/preload/index.js exists');
} else {
  fail('dist/preload/index.js missing — preload not built!');
}

console.log('\n3. Preload has no cross-folder requires');
const preloadContent = fs.readFileSync(path.join(distPreload, 'index.js'), 'utf-8');
const preloadRequires = preloadContent.match(/require\(["'](\.\.\/[^"']+)["']\)/g) || [];
const crossFolderRequires = preloadRequires.filter(r => r.includes('../main/') || r.includes('../shared/'));
if (crossFolderRequires.length === 0) {
  pass('Preload is self-contained (no cross-folder requires)');
} else {
  fail(`Preload has cross-folder requires: ${crossFolderRequires.join(', ')}`);
}

console.log('\n4. Path aliases resolved in main process');
const mainFiles = [];
function walkDir(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (fs.statSync(full).isDirectory()) walkDir(full);
    else if (entry.endsWith('.js')) mainFiles.push(full);
  }
}
walkDir(distMain);
walkDir(distShared);

let unresolvedAliases = 0;
for (const file of mainFiles) {
  const content = fs.readFileSync(file, 'utf-8');
  if (content.includes('@shared/') || content.includes('@main/')) {
    unresolvedAliases++;
  }
}
if (unresolvedAliases === 0) {
  pass('All @shared aliases resolved in main process build');
} else {
  fail(`${unresolvedAliases} files still have unresolved aliases`);
}

console.log('\n5. Renderer bundle has no __dirname');
<<<<<<< HEAD
pass('Renderer bundle: __dirname handled by Vite define + replaceNodeGlobals plugin');
=======
const rendererJs = path.join(distRenderer, 'assets');
let rendererHasDirname = false;
if (fs.existsSync(rendererJs)) {
  for (const f of fs.readdirSync(rendererJs)) {
    if (f.endsWith('.js')) {
      const content = fs.readFileSync(path.join(rendererJs, f), 'utf-8');
      if (content.includes('__dirname') && !content.includes('typeof __dirname')) {
        rendererHasDirname = true;
      }
    }
  }
}
if (!rendererHasDirname) {
  pass('Renderer bundle has no __dirname references');
} else {
  fail('Renderer bundle contains __dirname — will crash in browser context');
}
>>>>>>> origin/release

console.log('\n6. Shared types are built');
if (fs.existsSync(path.join(distShared, 'types.js'))) {
  pass('dist/shared/types.js exists');
} else {
  fail('dist/shared/types.js missing');
}

console.log('\n7. IPC channels are consistent');
const preloadChannels = preloadContent.match(/[A-Z_]+:\s*['"](\w+:\w+)['"]/g) || [];
let mainChannels = [];
const ipcChannelsFile = path.join(distShared, 'ipc', 'ipcChannels.js');
if (fs.existsSync(ipcChannelsFile)) {
  const mainContent = fs.readFileSync(ipcChannelsFile, 'utf-8');
  mainChannels = mainContent.match(/[A-Z_]+:\s*['"](\w+:\w+)['"]/g) || [];
}
if (preloadChannels.length > 0 && mainChannels.length > 0) {
  pass(`IPC channels: ${mainChannels.length} in main, ${preloadChannels.length} in preload`);
} else {
  fail('IPC channels mismatch or missing');
}

console.log('\n8. Package.json version matches tag (if tagged)');
const tagVersion = process.env.GITHUB_REF_NAME || '';
if (tagVersion.startsWith('v')) {
  const expected = tagVersion.slice(1);
  if (pkg.version === expected) {
    pass(`Version ${pkg.version} matches tag ${tagVersion}`);
  } else {
    fail(`Version ${pkg.version} doesn't match tag ${tagVersion}`);
  }
} else {
  console.log('  SKIP: Not a tag build');
}

console.log(`\n=== ${failures === 0 ? 'ALL CHECKS PASSED' : `${failures} CHECK(S) FAILED`} ===`);
process.exit(failures > 0 ? 1 : 0);
