import { shell } from 'electron';
import { randomUUID } from 'crypto';
import type {
  ClassifiedScanEntry,
  DeletionOptions,
  DeletionResult,
  DeletionSummary,
  UndoJournalEntry,
} from '@shared/types';
import { writeUndoJournal, updateJournalEntry } from './undoJournal';
import { isSystemExcluded } from '../platform/platformExclusions';

export class DeletionExecutor {
  async execute(
    entries: ClassifiedScanEntry[],
    options: DeletionOptions,
  ): Promise<DeletionSummary> {
    const batchId = randomUUID();

    const journalEntries: UndoJournalEntry[] = entries.map((e) => ({
      id: randomUUID(),
      path: e.path,
      sizeBytes: e.sizeBytes,
      category: e.category,
      riskTier: e.riskTier,
      deletedAt: new Date(),
      mode: options.mode,
      status: 'pending',
      batchId,
    }));

    await writeUndoJournal(journalEntries);

    const results: DeletionResult[] = [];

    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      const journalEntry = journalEntries[i];

      if (isSystemExcluded(entry.path, process.platform)) {
        updateJournalEntry(journalEntry.id, {
          status: 'failed',
          error: 'Refused: path is in a system-excluded directory.',
        });
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
          const { unlinkSync } = await import('fs');
          unlinkSync(entry.path);
        }
        updateJournalEntry(journalEntry.id, { status: 'completed' });
        results.push({ entry, success: true });
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        updateJournalEntry(journalEntry.id, { status: 'failed', error: errorMsg });
        results.push({ entry, success: false, error: errorMsg });
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
