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
