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

console.log('\n5. Renderer bundle is browser-safe');
const rendererAssets = path.join(distRenderer, 'assets');
let bundleProblems = [];
if (fs.existsSync(rendererAssets)) {
  for (const f of fs.readdirSync(rendererAssets)) {
    if (!f.endsWith('.js')) continue;
    const content = fs.readFileSync(path.join(rendererAssets, f), 'utf-8');
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const isQuote = (c) => c === '"' || c === "'";
      // __dirname: only a problem when not inside a string literal
      const dirnameIdx = line.indexOf('__dirname');
      if (dirnameIdx >= 0) {
        const before = dirnameIdx > 0 ? line[dirnameIdx - 1] : '';
        const after = dirnameIdx + 9 < line.length ? line[dirnameIdx + 9] : '';
        if (!(isQuote(before) && isQuote(after))) {
          bundleProblems.push(`${f}:${i + 1}: __dirname outside string literal`);
        }
      }
      // process.env and direct electron imports must be absent entirely
      if (line.includes('process.env')) {
        bundleProblems.push(`${f}:${i + 1}: process.env reference`);
      }
      if (/require\(["']electron["']\)/.test(line) || /from ["']electron["']/.test(line)) {
        bundleProblems.push(`${f}:${i + 1}: direct electron import`);
      }
    }
  }
}
if (bundleProblems.length === 0) {
  pass('Renderer bundle has no __dirname / process.env / electron imports');
} else {
  for (const p of bundleProblems.slice(0, 10)) {
    console.error(`  FAIL: ${p}`);
  }
  fail(`Renderer bundle is not browser-safe (${bundleProblems.length} problem(s))`);
}

console.log('\n6. Main-process runtime deps are declared in dependencies');
const NODE_BUILTINS = new Set([
  'assert', 'buffer', 'child_process', 'crypto', 'dns', 'events', 'fs', 'http', 'https',
  'module', 'net', 'os', 'path', 'querystring', 'readline', 'stream', 'string_decoder',
  'timers', 'tls', 'tty', 'url', 'util', 'worker_threads', 'zlib', 'node:test', 'console',
  'cluster', 'constants', 'domain', 'inspector', 'perf_hooks', 'process', 'punycode',
  'repl', 'sqlite', 'trace_events', 'v8', 'vm', 'wasi', 'async_hooks', 'diagnostics_channel',
  'dgram', 'test', 'test/reporters', 'sea', 'fs/promises', 'path/posix', 'path/win32',
  'stream/promises', 'stream/web', 'timers/promises', 'util/types', 'node:fs/promises',
]);
const declaredDeps = new Set(Object.keys(pkg.dependencies || {}));
const declaredDevDeps = new Set(Object.keys(pkg.devDependencies || {}));
const missingRuntimeDeps = new Set();
const devOnlyRuntimeDeps = new Set();
for (const file of mainFiles) {
  const content = fs.readFileSync(file, 'utf-8');
  const requires = content.match(/require\(["']([^"']+)["']\)/g) || [];
  for (const r of requires) {
    const mod = r.slice(9, -2);
    if (!mod || mod.startsWith('.') || mod.startsWith('/') || mod.startsWith('@shared')) continue;
    if (mod === 'electron' || NODE_BUILTINS.has(mod)) continue;
    if (!declaredDeps.has(mod)) {
      missingRuntimeDeps.add(mod);
      if (declaredDevDeps.has(mod)) devOnlyRuntimeDeps.add(mod);
    }
  }
}
if (missingRuntimeDeps.size === 0) {
  pass('All main-process require()s are satisfied by package.json dependencies');
} else {
  if (devOnlyRuntimeDeps.size > 0) {
    fail(`Runtime deps only in devDependencies (won't be packaged): ${[...devOnlyRuntimeDeps].join(', ')}`);
  } else {
    fail(`Missing runtime dependencies: ${[...missingRuntimeDeps].join(', ')}`);
  }
}

console.log('\n7. Shared types are built');
if (fs.existsSync(path.join(distShared, 'types.js'))) {
  pass('dist/shared/types.js exists');
} else {
  fail('dist/shared/types.js missing');
}

console.log('\n8. IPC channels are consistent');
function extractChannels(content) {
  const values = content.match(/['"]([\w-]+:[\w-]+)['"]/g) || [];
  return new Set(values.map((v) => v.slice(1, -1)));
}
const preloadChannels = extractChannels(preloadContent);
let mainChannels = new Set();
const ipcChannelsFile = path.join(distShared, 'ipc', 'ipcChannels.js');
if (fs.existsSync(ipcChannelsFile)) {
  const mainContent = fs.readFileSync(ipcChannelsFile, 'utf-8');
  mainChannels = extractChannels(mainContent);
}
if (mainChannels.size > 0 && preloadChannels.size > 0) {
  const missingInPreload = [...mainChannels].filter((c) => !preloadChannels.has(c));
  const missingInMain = [...preloadChannels].filter((c) => !mainChannels.has(c));
  if (missingInPreload.length === 0 && missingInMain.length === 0) {
    pass(`IPC channels match exactly (${mainChannels.size} in main, ${preloadChannels.size} in preload)`);
  } else {
    if (missingInPreload.length > 0) {
      fail(`Channels missing in preload: ${missingInPreload.join(', ')}`);
    }
    if (missingInMain.length > 0) {
      fail(`Channels missing in main: ${missingInMain.join(', ')}`);
    }
  }
} else {
  fail('IPC channels missing in one or both sides');
}

console.log('\n9. Package.json version matches tag (if tagged)');
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
