import { app, BrowserWindow } from 'electron';
import { join } from 'path';
import { registerIpcHandlers, loadRules } from './ipc/handlers';

function createWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    win.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'));
  }

  return win;
}

function setupAutoUpdater(): void {
  if (process.env.VITE_DEV_SERVER_URL) return;

  import('electron-updater').then(({ autoUpdater }) => {
    autoUpdater.checkForUpdatesAndNotify();

    autoUpdater.on('update-available', () => {
      console.log('Update available');
    });

    autoUpdater.on('update-downloaded', () => {
      console.log('Update downloaded, will install on quit');
    });
  }).catch((err) => {
    console.warn('Auto-updater not available:', err);
  });
}

app.whenReady().then(() => {
  const rulesDir = process.env.VITE_DEV_SERVER_URL
    ? join(process.cwd(), 'rules')
    : join(__dirname, '../../rules');

  loadRules(rulesDir);
  registerIpcHandlers();
  createWindow();
  setupAutoUpdater();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
