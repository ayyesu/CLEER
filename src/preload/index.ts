import { contextBridge, ipcRenderer } from 'electron';
import type {
  ClassifiedScanEntry,
  CleerApi,
  DeletionOptions,
  DuplicateGroup,
  PermissionStatus,
  ScanOptions,
  ScanProgress,
  ScheduleInterval,
  UndoJournalEntry,
} from '../shared/types';

const IPC_CHANNELS = {
  SCAN_START: 'scan:start',
  SCAN_ABORT: 'scan:abort',
  SCAN_PROGRESS: 'scan:progress',
  SCAN_RESULT_BATCH: 'scan:result-batch',
  SCAN_COMPLETE: 'scan:complete',
  SCAN_ERROR: 'scan:error',
  DEDUPE_START: 'dedupe:start',
  DEDUPE_PROGRESS: 'dedupe:progress',
  DEDUPE_COMPLETE: 'dedupe:complete',
  CLEAN_EXECUTE: 'clean:execute',
  CLEAN_PROGRESS: 'clean:progress',
  CLEAN_COMPLETE: 'clean:complete',
  CLEAN_ERROR: 'clean:error',
  JOURNAL_READ: 'journal:read',
  PERMISSION_STATUS: 'permission:status',
  PERMISSION_OPEN_SETTINGS: 'permission:open-settings',
  SCHEDULER_START: 'scheduler:start',
  SCHEDULER_STOP: 'scheduler:stop',
  SCHEDULER_STATUS: 'scheduler:status',
  SCHEDULER_SCAN_DUE: 'scheduler:scan-due',
  NOTIFICATION_SETTINGS: 'notification:settings',
  SCAN_PERMISSION_DENIED: 'scan:permission-denied',
  SYSTEM_GET_HOME: 'system:get-home',
} as const;

const cleerApi: CleerApi = {
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
    onPermissionDenied: (callback: (paths: string[]) => void) => {
      ipcRenderer.on(IPC_CHANNELS.SCAN_PERMISSION_DENIED, (_e, data) => callback(data));
    },
    removeAllListeners: () => {
      ipcRenderer.removeAllListeners(IPC_CHANNELS.SCAN_PROGRESS);
      ipcRenderer.removeAllListeners(IPC_CHANNELS.SCAN_RESULT_BATCH);
      ipcRenderer.removeAllListeners(IPC_CHANNELS.SCAN_COMPLETE);
      ipcRenderer.removeAllListeners(IPC_CHANNELS.SCAN_ERROR);
      ipcRenderer.removeAllListeners(IPC_CHANNELS.SCAN_PERMISSION_DENIED);
      ipcRenderer.removeAllListeners(IPC_CHANNELS.DEDUPE_PROGRESS);
      ipcRenderer.removeAllListeners(IPC_CHANNELS.DEDUPE_COMPLETE);
    },
  },
  system: {
    getHomeDir: (): Promise<string> =>
      ipcRenderer.invoke(IPC_CHANNELS.SYSTEM_GET_HOME),
  },
  dedupe: {
    start: (options?: { minSizeBytes?: number }) =>
      ipcRenderer.invoke(IPC_CHANNELS.DEDUPE_START, options),
    onProgress: (callback: (progress: { phase: string; processed: number; total: number }) => void) => {
      ipcRenderer.on(IPC_CHANNELS.DEDUPE_PROGRESS, (_e, data) => callback(data));
    },
    onComplete: (callback: (result: { groups: DuplicateGroup[]; totalWasted: number }) => void) => {
      ipcRenderer.on(IPC_CHANNELS.DEDUPE_COMPLETE, (_e, data) => callback(data));
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
  permissions: {
    getStatus: (): Promise<PermissionStatus> =>
      ipcRenderer.invoke(IPC_CHANNELS.PERMISSION_STATUS),
    openSettings: (): Promise<void> =>
      ipcRenderer.invoke(IPC_CHANNELS.PERMISSION_OPEN_SETTINGS),
  },
  scheduler: {
    start: (config: { interval: ScheduleInterval; scanOptions: ScanOptions }) =>
      ipcRenderer.invoke(IPC_CHANNELS.SCHEDULER_START, config),
    stop: () => ipcRenderer.invoke(IPC_CHANNELS.SCHEDULER_STOP),
    getStatus: () => ipcRenderer.invoke(IPC_CHANNELS.SCHEDULER_STATUS),
    onScanDue: (callback: (options: ScanOptions) => void) => {
      ipcRenderer.on(IPC_CHANNELS.SCHEDULER_SCAN_DUE, (_e, data) => callback(data));
    },
  },
  notifications: {
    setEnabled: (enabled: boolean) =>
      ipcRenderer.invoke(IPC_CHANNELS.NOTIFICATION_SETTINGS, enabled),
  },
};

contextBridge.exposeInMainWorld('cleer', cleerApi);
