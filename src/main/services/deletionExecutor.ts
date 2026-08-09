import { shell } from 'electron';
import type {
  ClassifiedScanEntry,
  DeletionOptions,
  DeletionResult,
  DeletionSummary,
  UndoJournalEntry,
} from '@shared/types';
import { writeUndoJournal } from './undoJournal';
import { isSystemExcluded } from '../platform/platformExclusions';

export class DeletionExecutor {
  async execute(
    entries: ClassifiedScanEntry[],
    options: DeletionOptions,
  ): Promise<DeletionSummary> {
    const journalEntries: UndoJournalEntry[] = entries.map((e) => ({
      path: e.path,
      sizeBytes: e.sizeBytes,
      category: e.category,
      riskTier: e.riskTier,
      deletedAt: new Date(),
      mode: options.mode,
    }));

    await writeUndoJournal(journalEntries);

    const results: DeletionResult[] = [];

    for (const entry of entries) {
      if (isSystemExcluded(entry.path, process.platform)) {
        results.push({
          entry,
          success: false,
          error: 'Refused: path is in a system-excluded directory.',
        });
        continue;
      }

      try {
        if (options.mode === 'trash') {
          await shell.trashItem(entry.path);
        } else {
          // Permanent deletion — only reached after explicit separate confirmation
          const { unlinkSync } = await import('fs');
          unlinkSync(entry.path);
        }
        results.push({ entry, success: true });
      } catch (err) {
        results.push({
          entry,
          success: false,
          error: err instanceof Error ? err.message : 'Unknown error',
        });
      }
    }

    return {
      totalAttempted: entries.length,
      totalSucceeded: results.filter((r) => r.success).length,
      totalFailed: results.filter((r) => !r.success).length,
      bytesReclaimed: results
        .filter((r) => r.success)
        .reduce((sum, r) => sum + r.entry.sizeBytes, 0),
      results,
    };
  }
}

export function createDeletionExecutor(): DeletionExecutor {
  return new DeletionExecutor();
}
