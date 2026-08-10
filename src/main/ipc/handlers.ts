import { ipcMain, shell, BrowserWindow } from 'electron';
import { IPC_CHANNELS } from './ipcChannels';
import { createScannerEngine } from '../services/scannerEngine';
import { createDeletionExecutor } from '../services/deletionExecutor';
import { createRulesEngine } from '../services/rulesEngine';
import { createDuplicateDetector } from '../services/duplicateDetector';
import { createScheduler } from '../services/scheduler';
import { createNotificationService } from '../services/notificationService';
import { detectPermissions } from '../services/permissionsService';
import { readUndoJournal } from '../services/undoJournal';
import { scanOptionsSchema, deletionOptionsSchema } from '@shared/schemas';
import type { ClassifiedScanEntry, DeletionSummary, ScanOptions } from '@shared/types';
import { sendToRenderers } from './ipcEvents';

let rulesEngine = createRulesEngine();

export function loadRules(rulesDir: string): void {
  rulesEngine = createRulesEngine();
  rulesEngine.loadAllPlatforms(rulesDir);
}

export function registerIpcHandlers(): void {
  const scanner = createScannerEngine();
  scanner.setRules(rulesEngine.getAllRules());

  const deletionExecutor = createDeletionExecutor();
  const dedetector = createDuplicateDetector();
  let lastResults: ClassifiedScanEntry[] = [];
  let workersDone = 0;
  let totalWorkers = 0;

  ipcMain.handle(IPC_CHANNELS.SCAN_START, async (_event, rawOptions) => {
    const options = scanOptionsSchema.parse(rawOptions);
    lastResults = [];
    workersDone = 0;
    totalWorkers = options.categories.length;

    scanner.on('entries', (entries: ClassifiedScanEntry[]) => {
      lastResults.push(...entries);
      sendToRenderers(IPC_CHANNELS.SCAN_RESULT_BATCH, entries);
    });

    scanner.on('progress', (progress) => {
      sendToRenderers(IPC_CHANNELS.SCAN_PROGRESS, {
        ...progress,
        phase: 'scanning',
      });
    });

    scanner.on('worker-done', () => {
      workersDone++;
      if (workersDone >= totalWorkers) {
        sendToRenderers(IPC_CHANNELS.SCAN_COMPLETE, {
          totalEntries: lastResults.length,
          totalBytes: lastResults.reduce((s, e) => s + e.sizeBytes, 0),
        });
        if (scanner.permissionDeniedPaths.length > 0) {
          sendToRenderers('scan:permission-denied', scanner.permissionDeniedPaths);
        }
      }
    });

    scanner.on('error', (err: Error) => {
      sendToRenderers(IPC_CHANNELS.SCAN_ERROR, { message: err.message });
    });

    await scanner.start(options);
    return { success: true, categories: options.categories };
  });

  ipcMain.handle(IPC_CHANNELS.SCAN_ABORT, async () => {
    scanner.abort();
    return { success: true };
  });

  ipcMain.handle(IPC_CHANNELS.DEDUPE_START, async (_event, options?) => {
    sendToRenderers(IPC_CHANNELS.DEDUPE_PROGRESS, {
      phase: 'hashing',
      processed: 0,
      total: lastResults.length,
    });

    const groups = await dedetector.findDuplicates(lastResults, {
      minSizeBytes: options?.minSizeBytes,
      onProgress: (processed, total) => {
        sendToRenderers(IPC_CHANNELS.DEDUPE_PROGRESS, {
          phase: 'hashing',
          processed,
          total,
        });
      },
    });

    for (const group of groups) {
      for (const dup of group.duplicates) {
        const entry = lastResults.find((e) => e.path === dup.path);
        if (entry) entry.isDuplicateOf = dup.isDuplicateOf;
      }
    }

    sendToRenderers(IPC_CHANNELS.DEDUPE_COMPLETE, {
      groups,
      totalWasted: groups.reduce((s, g) => s + g.wastedBytes, 0),
    });

    return { groups: groups.length };
  });

  ipcMain.handle(IPC_CHANNELS.CLEAN_EXECUTE, async (_event, payload) => {
    const { entryIds, options } = payload;
    const deletionOptions = deletionOptionsSchema.parse(options);

    const entries = lastResults.filter((e) => entryIds.includes(e.path));
    const summary: DeletionSummary = await deletionExecutor.execute(
      entries,
      deletionOptions,
    );

    return summary;
  });

  ipcMain.handle(IPC_CHANNELS.JOURNAL_READ, async () => {
    return readUndoJournal();
  });

  ipcMain.handle(IPC_CHANNELS.PERMISSION_STATUS, async () => {
    return detectPermissions(process.platform as 'win32' | 'darwin' | 'linux');
  });

  ipcMain.handle(IPC_CHANNELS.PERMISSION_OPEN_SETTINGS, async () => {
    if (process.platform === 'darwin') {
      shell.openExternal('x-apple.systempreferences:com.apple.preference.security?Privacy_AllFiles');
    } else if (process.platform === 'win32') {
      shell.openExternal('ms-settings:privacy-fullaccess');
    }
  });

  const scheduler = createScheduler();
  const notifications = createNotificationService();
  let lastScheduledResults: { totalEntries: number; totalBytes: number } | null = null;

  scheduler.on('scan-due', async (options: ScanOptions) => {
    const scheduledScanner = createScannerEngine();
    scheduledScanner.setRules(rulesEngine.getAllRules());

    let totalEntries = 0;
    let totalBytes = 0;

    scheduledScanner.on('entries', (entries: ClassifiedScanEntry[]) => {
      totalEntries += entries.length;
      totalBytes += entries.reduce((s, e) => s + e.sizeBytes, 0);
    });

    scheduledScanner.on('worker-done', () => {
      lastScheduledResults = { totalEntries, totalBytes };
      scheduler.onScanComplete();
    });

    scheduledScanner.on('error', () => {
      scheduler.onScanComplete();
    });

    sendToRenderers(IPC_CHANNELS.SCHEDULER_SCAN_DUE, options);
    await scheduledScanner.start(options);
  });

  scheduler.on('scan-complete', () => {
    if (lastScheduledResults) {
      notifications.showScanComplete(
        lastScheduledResults.totalEntries,
        lastScheduledResults.totalBytes,
      );
    }
  });

  ipcMain.handle(IPC_CHANNELS.SCHEDULER_START, async (_event, config) => {
    scheduler.start(config);
    return { success: true };
  });

  ipcMain.handle(IPC_CHANNELS.SCHEDULER_STOP, async () => {
    scheduler.stop();
    return { success: true };
  });

  ipcMain.handle(IPC_CHANNELS.SCHEDULER_STATUS, async () => {
    return {
      isActive: scheduler.isActive,
      isRunning: scheduler.isRunning,
      nextRun: scheduler.nextRun,
      config: scheduler.currentConfig,
    };
  });

  ipcMain.handle(IPC_CHANNELS.NOTIFICATION_SETTINGS, async (_event, enabled: boolean) => {
    notifications.setEnabled(enabled);
    return { enabled: notifications.isEnabled };
  });

  ipcMain.handle('download-file', async (_event, { url }: { url: string; filename: string }) => {
    const win = BrowserWindow.getFocusedWindow();
    if (win) {
      await win.webContents.session.downloadURL(url);
    }
    return { success: true };
  });
}
