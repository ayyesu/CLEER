import { ipcMain } from 'electron';
import { IPC_CHANNELS } from './ipcChannels';
import { createScannerEngine } from '../services/scannerEngine';
import { createDeletionExecutor } from '../services/deletionExecutor';
import { readUndoJournal } from '../services/undoJournal';
import { scanOptionsSchema, deletionOptionsSchema } from '@shared/schemas';
import type { ClassifiedScanEntry, DeletionSummary } from '@shared/types';

export function registerIpcHandlers(): void {
  const scanner = createScannerEngine();
  const deletionExecutor = createDeletionExecutor();
  let lastResults: ClassifiedScanEntry[] = [];

  ipcMain.handle(IPC_CHANNELS.SCAN_START, async (_event, rawOptions) => {
    const options = scanOptionsSchema.parse(rawOptions);

    scanner.on('entries', (entries: ClassifiedScanEntry[]) => {
      lastResults.push(...entries);
    });

    await scanner.start(options);
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
