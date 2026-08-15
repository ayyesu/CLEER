#!/usr/bin/env node
// Captures real screenshots of the CLEER renderer (first-run, idle, results,
// duplicates, selection/confirm) by driving the real preload + renderer with
// mocked IPC handlers. Run with: electron scripts/capture-screens.js
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

// Use a throwaway userData dir so localStorage (first-run flag) is always clean.
const USER_DATA = path.join(__dirname, '..', 'dist-app', 'capture-userdata');
fs.rmSync(USER_DATA, { recursive: true, force: true });
app.setPath('userData', USER_DATA);

const OUT = path.join(__dirname, '..', 'website', 'public', 'screenshots');
fs.mkdirSync(OUT, { recursive: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// --- Mock data -----------------------------------------------------------
const TIERS = ['safe', 'safe', 'safe', 'caution', 'caution', 'dangerous'];
const CATS = ['temp', 'cache', 'log', 'dev-cache', 'dev-artifact', 'package-manager', 'orphaned-app', 'duplicate'];
const CAT_LABELS = {
  temp: 'Temporary Files', cache: 'Caches', log: 'Log Files', 'dev-cache': 'Dev Caches',
  'dev-artifact': 'Dev Artifacts', 'package-manager': 'Package Manager',
  'orphaned-app': 'Orphaned Apps', duplicate: 'Duplicates',
};
const ROOTS = [
  'C:\\Users\\demo\\AppData\\Local\\Temp',
  'C:\\Users\\demo\\AppData\\Local\\npm-cache',
  'C:\\Users\\demo\\AppData\\Local\\Microsoft\\Edge\\User Data\\Default\\Cache',
  'C:\\Users\\demo\\AppData\\Roaming\\Code\\Cache',
  'C:\\Users\\demo\\AppData\\Local\\pip\\cache',
  'C:\\Users\\demo\\.gradle\\caches',
  'C:\\Users\\demo\\AppData\\Local\\Yarn\\Cache',
  'C:\\Users\\demo\\AppData\\Local\\Google\\Chrome\\User Data\\Default\\Code Cache',
];
const FILES = [
  'renderer_3b4f2a.log', 'chrome_100_percent.pak.tmp', 'cache_2f8d31.bin', 'index-9f3a2c.js',
  'npm-cache_7e11b2.cache', 'v8-code-cache_aa19f0.bin', 'deps_4c9012.obj', 'installer_8d20e7.msi',
  'temp_55c1e9.tmp', 'build_77f2ab.war', 'history_9b3d10.json', 'packages_2e88f4.cache',
  'gradle_11c4d5.jar', 'session_63f7c8.bak', 'lock_8a10e6.lock', 'thumbnails_5d9c42.dat',
  'metrics_d4e11f.log', 'cache_09b2a7.tmp', 'state_77e3c9.json', 'chunks_3a6d0b.part',
];

function makeEntries(count) {
  const out = [];
  for (let i = 0; i < count; i++) {
    const root = ROOTS[i % ROOTS.length];
    const file = FILES[i % FILES.length];
    const size = [4.5, 1.2, 12.8, 0.8, 3.1, 22.4, 0.6, 8.9, 2.3, 15.7, 1.9, 6.4, 0.4, 11.2, 5.8, 0.9][i % 16] * 1024 * 1024;
    const tier = TIERS[i % TIERS.length];
    const category = CATS[i % CATS.length];
    const daysAgo = (i * 3) % 90;
    const d = new Date(Date.now() - daysAgo * 86400000);
    out.push({
      path: `${root}\\${file}`,
      sizeBytes: Math.round(size),
      kind: 'file',
      category,
      lastAccessed: new Date(d.getTime() - 3600000).toISOString(),
      lastModified: d.toISOString(),
      riskTier: tier,
      regenerable: tier === 'safe',
      isDuplicateOf: category === 'duplicate' && i > 0 ? out[i - 1]?.path : undefined,
    });
  }
  return out;
}

const ENTRIES = makeEntries(48);
const JOURNAL = [
  {
    id: 'j1', path: 'C:\\Users\\demo\\AppData\\Local\\Temp\\installer_8d20e7.msi', sizeBytes: 1024 * 1024 * 22,
    category: 'temp', riskTier: 'safe', deletedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    mode: 'trash', status: 'completed', batchId: 'b-1',
  },
  {
    id: 'j2', path: 'C:\\Users\\demo\\AppData\\Local\\npm-cache\\npm-cache_7e11b2.cache', sizeBytes: 1024 * 1024 * 4,
    category: 'cache', riskTier: 'safe', deletedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    mode: 'trash', status: 'completed', batchId: 'b-1',
  },
  {
    id: 'j3', path: 'C:\\Users\\demo\\.gradle\\caches\\gradle_11c4d5.jar', sizeBytes: 1024 * 1024 * 18,
    category: 'dev-cache', riskTier: 'caution', deletedAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    mode: 'trash', status: 'completed', batchId: 'b-2',
  },
];

// --- Mock IPC ------------------------------------------------------------
ipcMain.handle('system:get-home', () => 'C:\\Users\\demo');
ipcMain.handle('permission:status', () => ({
  platform: 'win32', level: 'full', canScanSystem: true, canScanHome: true, canWriteTrash: true,
  inaccessiblePaths: [], warnings: [], actionable: false,
}));
ipcMain.handle('journal:read', () => JOURNAL);
ipcMain.handle('scan:start', () => ({ success: true, categories: [] }));
ipcMain.handle('scan:abort', () => ({ success: true }));
ipcMain.handle('dedupe:start', () => ({ groups: 0 }));
ipcMain.handle('clean:execute', () => ({ totalAttempted: 0, totalSucceeded: 0, totalFailed: 0, bytesReclaimed: 0, results: [] }));
ipcMain.handle('scheduler:start', () => ({ success: true }));
ipcMain.handle('scheduler:stop', () => ({ success: true }));
ipcMain.handle('scheduler:status', () => ({ isActive: false, isRunning: false, nextRun: null, config: null }));
ipcMain.handle('notification:settings', () => ({ enabled: true }));

async function capture(win, name) {
  for (let attempt = 0; attempt < 3; attempt++) {
    await sleep(500);
    const image = await win.webContents.capturePage();
    if (!image.isEmpty()) {
      fs.writeFileSync(path.join(OUT, `${name}.png`), image.toPNG());
      console.log(`captured ${name}.png`);
      return;
    }
  }
  console.error(`WARN: ${name}.png was empty after 3 attempts`);
}

app.whenReady().then(async () => {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    show: true,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, '..', 'dist', 'preload', 'index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  win.loadFile(path.join(__dirname, '..', 'dist', 'renderer', 'index.html'));
  await new Promise((r) => win.webContents.once('did-finish-load', r));
  await sleep(2000);

  // 1. First-run onboarding
  await capture(win, 'first-run');

  // Skip onboarding
  await win.webContents.executeJavaScript(
    `localStorage.setItem('cleer.firstRunComplete', 'true'); location.reload();`,
  );
  await new Promise((r) => win.webContents.once('did-finish-load', r));
  await sleep(1200);

  // 2. Idle state
  await capture(win, 'scanner-idle');

  // 3. Simulate a running scan (click Start Scan, then stream progress)
  await win.webContents.executeJavaScript(
    `(() => { const b = [...document.querySelectorAll('button')].find(x => x.textContent.includes('Start Scan')); if (b) b.click(); return !!b; })()`,
  );
  await sleep(400);
  win.webContents.send('scan:progress', {
    phase: 'scanning', entriesFound: 12483, bytesFound: 1.2 * 1024 ** 3,
    currentPath: 'C:\\Users\\demo\\AppData\\Local\\Microsoft\\Edge\\User Data\\Default\\Cache',
  });
  await sleep(400);
  await capture(win, 'scanner-scanning');

  // 4. Results
  win.webContents.send('scan:result-batch', ENTRIES);
  await sleep(350);
  win.webContents.send('scan:complete', {
    totalEntries: ENTRIES.length,
    totalBytes: ENTRIES.reduce((s, e) => s + e.sizeBytes, 0),
  });
  await sleep(1000);
  await capture(win, 'scanner-results');

  // 5. Duplicates panel
  const groups = [
    {
      keeper: ENTRIES[0],
      duplicates: [ENTRIES[1], ENTRIES[2]],
      sizeBytes: ENTRIES[0].sizeBytes,
      wastedBytes: ENTRIES[0].sizeBytes * 2,
    },
  ];
  win.webContents.send('dedupe:complete', { groups, totalWasted: groups[0].wastedBytes });
  await sleep(700);
  await capture(win, 'scanner-duplicates');

  // 6. Select first row -> selection bar + confirm modal
  await win.webContents.executeJavaScript(
    `(() => { const cb = document.querySelector('input[type=checkbox]:not(:disabled)'); if (cb) cb.click(); return !!cb; })()`,
  );
  await sleep(500);
  await capture(win, 'scanner-selected');
  await win.webContents.executeJavaScript(
    `(() => { const b = [...document.querySelectorAll('button')].find(x => x.textContent.includes('Clean Selected')); if (b) b.click(); return !!b; })()`,
  );
  await sleep(500);
  await capture(win, 'scanner-confirm');

  // 7. History view
  await win.webContents.executeJavaScript(
    `(() => { const b = [...document.querySelectorAll('button')].find(x => x.textContent.includes('Cleanups')); if (b) b.click(); return !!b; })()`,
  );
  await sleep(700);
  await capture(win, 'history');

  console.log('ALL SCREENSHOTS CAPTURED');
  app.exit(0);
});
