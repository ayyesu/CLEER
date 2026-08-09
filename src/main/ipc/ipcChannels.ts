export const IPC_CHANNELS = {
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
} as const;

export type IpcChannel = (typeof IPC_CHANNELS)[keyof typeof IPC_CHANNELS];
