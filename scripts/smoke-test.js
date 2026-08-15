#!/usr/bin/env node
// Smoke test: boots the real built app (dist/main/index.js) and fails if the
// renderer reports console errors/warnings or the window fails to load.
// Must be run with the Electron binary, not plain node:
//   electron scripts/smoke-test.js
const { app, BrowserWindow } = require('electron');

let exitCode = 0;

function fail(msg) {
  console.error(msg);
  exitCode = 1;
}

function attachWindowListeners(win) {
  win.webContents.on('console-message', (event, level, message) => {
    // level: 0 verbose, 1 info, 2 warning, 3 error
    if (level >= 2) {
      fail(`[RENDERER ${level === 2 ? 'WARNING' : 'ERROR'}] ${message}`);
    }
  });

  win.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    fail(`[LOAD FAILED] ${errorCode}: ${errorDescription}`);
  });

  win.webContents.on('render-process-gone', (event, details) => {
    fail(`[RENDER PROCESS GONE] ${details.reason}`);
  });
}

app.on('browser-window-created', (event, win) => {
  attachWindowListeners(win);
});

app.on('ready', () => {
  // Boot the real application: loads rules, registers IPC handlers, creates the window.
  require('../dist/main/index.js');

  const deadline = setTimeout(() => {
    fail('TIMEOUT: App did not load within 30 seconds');
    app.exit(1);
  }, 30000);

  // Wait for a window to exist and finish loading before judging the result.
  const checkInterval = setInterval(() => {
    const wins = BrowserWindow.getAllWindows();
    const loaded = wins.some(
      (w) => !w.isDestroyed() && !w.webContents.isLoading(),
    );
    if (!loaded) return;

    clearInterval(checkInterval);
    clearTimeout(deadline);

    setTimeout(() => {
      if (exitCode === 0) {
        console.log('SMOKE TEST PASSED');
        app.exit(0);
      } else {
        console.error('SMOKE TEST FAILED');
        app.exit(1);
      }
    }, 3000);
  }, 500);
});

app.on('window-all-closed', () => {
  app.quit();
});
