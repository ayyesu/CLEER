#!/usr/bin/env node
const { app, BrowserWindow } = require('electron');
const path = require('path');

let exitCode = 0;

app.on('ready', () => {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, '../dist/preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  win.webContents.on('console-message', (event, level, message) => {
    if (level === 2) {
      console.error(`[RENDERER ERROR] ${message}`);
      exitCode = 1;
    }
  });

  win.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error(`[LOAD FAILED] ${errorCode}: ${errorDescription}`);
    exitCode = 1;
  });

  win.webContents.on('render-process-gone', (event, details) => {
    console.error(`[RENDER PROCESS GONE] ${details.reason}`);
    exitCode = 1;
  });

  win.loadFile(path.join(__dirname, '../dist/renderer/index.html'))
    .then(() => {
      console.log('Window loaded successfully');

      setTimeout(() => {
        if (exitCode === 0) {
          console.log('SMOKE TEST PASSED');
        } else {
          console.error('SMOKE TEST FAILED');
        }
        app.quit();
        process.exit(exitCode);
      }, 3000);
    })
    .catch((err) => {
      console.error(`Failed to load: ${err.message}`);
      app.quit();
      process.exit(1);
    });
});

app.on('window-all-closed', () => {
  app.quit();
});

setTimeout(() => {
  console.error('TIMEOUT: App did not load within 15 seconds');
  app.quit();
  process.exit(1);
}, 15000);
