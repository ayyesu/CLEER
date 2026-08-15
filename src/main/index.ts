import { app, BrowserWindow } from 'electron';
import { join } from 'path';
import { registerIpcHandlers, loadRules } from './ipc/handlers';

function createWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
      spellcheck: false,
    },
  });

  win.once('ready-to-show', () => {
    win.show();
  });

  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));

  win.webContents.on('will-navigate', (event, url) => {
    const currentUrl = win.webContents.getURL();
    const allowed = url.startsWith('file://') ||
      (process.env.VITE_DEV_SERVER_URL && url.startsWith(process.env.VITE_DEV_SERVER_URL));
    if (currentUrl && !allowed) {
      event.preventDefault();
    }
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    win.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'));
  }

  return win;
}

function setupAutoUpdater(): void {
  if (!app.isPackaged) return;

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
  if (process.platform === 'win32') {
    app.setAppUserModelId('com.cleer.app');
  }

  const rulesDir = process.env.VITE_DEV_SERVER_URL
    ? join(process.cwd(), 'rules')
    : join(app.getAppPath(), 'rules');

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
