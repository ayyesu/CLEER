import { contextBridge, ipcRenderer } from 'electron';
import { IPC_CHANNELS } from '../main/ipc/ipcChannels';
import type {
  ClassifiedScanEntry,
  DeletionOptions,
  ScanOptions,
  ScanProgress,
  UndoJournalEntry,
} from '@shared/types';

const cleerApi = {
  scan: {
    start: (options: ScanOptions) =>
      ipcRenderer.invoke(IPC_CHANNELS.SCAN_START, options),
    abort: () => ipcRenderer.invoke(IPC_CHANNELS.SCAN_ABORT),
    onProgress: (callback: (progress: ScanProgress) => void) => {
      ipcRenderer.on(IPC_CHANNELS.SCAN_PROGRESS, (_e, data) => callback(data));
    },
    onResultBatch: (callback: (entries: ClassifiedScanEntry[]) => void) => {
      ipcRenderer.on(IPC_CHANNELS.SCAN_RESULT_BATCH, (_e, data) =>
        callback(data),
      );
    },
    onComplete: (callback: (summary: { totalEntries: number; totalBytes: number }) => void) => {
      ipcRenderer.on(IPC_CHANNELS.SCAN_COMPLETE, (_e, data) => callback(data));
    },
    onError: (callback: (error: { message: string }) => void) => {
      ipcRenderer.on(IPC_CHANNELS.SCAN_ERROR, (_e, data) => callback(data));
    },
    removeAllListeners: () => {
      ipcRenderer.removeAllListeners(IPC_CHANNELS.SCAN_PROGRESS);
      ipcRenderer.removeAllListeners(IPC_CHANNELS.SCAN_RESULT_BATCH);
      ipcRenderer.removeAllListeners(IPC_CHANNELS.SCAN_COMPLETE);
      ipcRenderer.removeAllListeners(IPC_CHANNELS.SCAN_ERROR);
    },
  },
  clean: {
    execute: (entryIds: string[], options: DeletionOptions) =>
      ipcRenderer.invoke(IPC_CHANNELS.CLEAN_EXECUTE, { entryIds, options }),
  },
  journal: {
    read: (): Promise<UndoJournalEntry[]> =>
      ipcRenderer.invoke(IPC_CHANNELS.JOURNAL_READ),
  },
};

contextBridge.exposeInMainWorld('cleer', cleerApi);


