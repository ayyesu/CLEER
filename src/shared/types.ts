export type Platform = 'win32' | 'darwin' | 'linux';

export type RiskTier = 'safe' | 'caution' | 'dangerous';

export type CleanupCategory =
  | 'temp'
  | 'cache'
  | 'log'
  | 'dev-cache'
  | 'dev-artifact'
  | 'duplicate'
  | 'old-download'
  | 'package-manager'
  | 'orphaned-app'
  | 'recycle-bin';

export type EntryKind = 'file' | 'directory' | 'symlink';

export type DeletionMode = 'trash' | 'permanent';

export interface ScanEntry {
  path: string;
  sizeBytes: number;
  kind: EntryKind;
  category: CleanupCategory;
  lastAccessed?: Date;
  lastModified?: Date;
  ownerApp?: string;
  isDuplicateOf?: string;
}

export interface ClassifiedScanEntry extends ScanEntry {
  riskTier: RiskTier;
  regenerable: boolean;
}

export interface ScanOptions {
  categories: CleanupCategory[];
  targetPaths: string[];
  maxDepth?: number;
  minSizeBytes?: number;
}

export interface ScanProgress {
  phase: 'scanning' | 'classifying' | 'done' | 'error';
  entriesFound: number;
  bytesFound: number;
  currentPath?: string;
}

export interface DeletionOptions {
  mode: DeletionMode;
}

export interface DeletionResult {
  entry: ClassifiedScanEntry;
  success: boolean;
  error?: string;
}

export interface DeletionSummary {
  totalAttempted: number;
  totalSucceeded: number;
  totalFailed: number;
  bytesReclaimed: number;
  results: DeletionResult[];
}

export interface UndoJournalEntry {
  path: string;
  sizeBytes: number;
  category: CleanupCategory;
  riskTier: RiskTier;
  deletedAt: Date;
  mode: DeletionMode;
}

export interface RuleDefinition {
  id: string;
  category: CleanupCategory;
  platforms: Platform[];
  paths: string[];
  riskTier: RiskTier;
  regenerable: boolean;
  description: string;
}

export interface ScanSummary {
  totalEntries: number;
  totalBytes: number;
}

export interface CleerApi {
  scan: {
    start: (options: ScanOptions) => Promise<{ success: boolean; categories: CleanupCategory[] }>;
    abort: () => Promise<{ success: boolean }>;
    onProgress: (callback: (progress: ScanProgress) => void) => void;
    onResultBatch: (callback: (entries: ClassifiedScanEntry[]) => void) => void;
    onComplete: (callback: (summary: ScanSummary) => void) => void;
    onError: (callback: (error: { message: string }) => void) => void;
    removeAllListeners: () => void;
  };
  clean: {
    execute: (entryIds: string[], options: DeletionOptions) => Promise<DeletionSummary>;
  };
  journal: {
    read: () => Promise<UndoJournalEntry[]>;
  };
}

export const CATEGORY_LABELS: Record<CleanupCategory, string> = {
  'temp': 'Temporary Files',
  'cache': 'Caches',
  'log': 'Log Files',
  'dev-cache': 'Dev Caches',
  'dev-artifact': 'Dev Artifacts',
  'duplicate': 'Duplicates',
  'old-download': 'Old Downloads',
  'package-manager': 'Package Manager',
  'orphaned-app': 'Orphaned Apps',
  'recycle-bin': 'Recycle Bin',
};

export const TIER_COLORS: Record<RiskTier, { bg: string; text: string; border: string; dot: string }> = {
  safe: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30', dot: 'bg-emerald-400' },
  caution: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30', dot: 'bg-amber-400' },
  dangerous: { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/30', dot: 'bg-rose-400' },
};
