import { contextBridge, ipcRenderer } from 'electron';
import { IPC_CHANNELS } from '../main/ipc/ipcChannels';
import type {
  DeletionOptions,
  ScanOptions,
  UndoJournalEntry,
} from '@shared/types';

const cleerApi = {
  scan: {
    start: (options: ScanOptions) =>
      ipcRenderer.invoke(IPC_CHANNELS.SCAN_START, options),
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

export type CleerApi = typeof cleerApi;
