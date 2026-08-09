import { ipcMain } from 'electron';
import { IPC_CHANNELS } from './ipcChannels';
import { createScannerEngine } from '../services/scannerEngine';
import { createDeletionExecutor } from '../services/deletionExecutor';
import { createRulesEngine } from '../services/rulesEngine';
import { readUndoJournal } from '../services/undoJournal';
import { scanOptionsSchema, deletionOptionsSchema } from '@shared/schemas';
import type { ClassifiedScanEntry, DeletionSummary } from '@shared/types';
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
}
