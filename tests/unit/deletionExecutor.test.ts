import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('electron', () => ({
  shell: { trashItem: vi.fn() },
}));

vi.mock('../../src/main/services/undoJournal', () => ({
  writeUndoJournal: vi.fn(),
}));

vi.mock('../../src/main/platform/platformExclusions', () => ({
  isSystemExcluded: vi.fn(() => false),
}));

import { createDeletionExecutor } from '../../src/main/services/deletionExecutor';
import type { ClassifiedScanEntry } from '@shared/types';
import { isSystemExcluded } from '../../src/main/platform/platformExclusions';
import { writeUndoJournal } from '../../src/main/services/undoJournal';
import { shell } from 'electron';

const mockShell = shell as unknown as { trashItem: ReturnType<typeof vi.fn> };
const mockJournal = writeUndoJournal as unknown as ReturnType<typeof vi.fn>;

describe('DeletionExecutor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const fakeEntry: ClassifiedScanEntry = {
    path: '/home/user/.cache/npm/file',
    sizeBytes: 1024,
    kind: 'file',
    category: 'dev-cache',
    riskTier: 'safe',
    regenerable: true,
  };

  it('writes undo journal before deletion', async () => {
    mockShell.trashItem.mockResolvedValue(undefined);

    const executor = createDeletionExecutor();
    await executor.execute([fakeEntry], { mode: 'trash' });

    expect(mockJournal).toHaveBeenCalledOnce();
    expect(mockShell.trashItem).toHaveBeenCalled();
  });

  it('refuses to delete system-excluded paths', async () => {
    (isSystemExcluded as unknown as ReturnType<typeof vi.fn>).mockReturnValue(true);

    const executor = createDeletionExecutor();
    const summary = await executor.execute([fakeEntry], { mode: 'trash' });

    expect(summary.totalFailed).toBe(1);
    expect(summary.results[0].error).toContain('system-excluded');
    expect(mockShell.trashItem).not.toHaveBeenCalled();

    (isSystemExcluded as unknown as ReturnType<typeof vi.fn>).mockReturnValue(false);
  });

  it('succeeds with trash mode', async () => {
    mockShell.trashItem.mockResolvedValue(undefined);

    const executor = createDeletionExecutor();
    const summary = await executor.execute([fakeEntry], { mode: 'trash' });

    expect(summary.totalSucceeded).toBe(1);
    expect(summary.bytesReclaimed).toBe(1024);
    expect(mockShell.trashItem).toHaveBeenCalledWith('/home/user/.cache/npm/file');
  });

  it('reports partial failures without aborting batch', async () => {
    mockShell.trashItem
      .mockRejectedValueOnce(new Error('permission denied'))
      .mockResolvedValueOnce(undefined);

    const entry2: ClassifiedScanEntry = {
      ...fakeEntry,
      path: '/home/user/.cache/pip/file',
    };

    const executor = createDeletionExecutor();
    const summary = await executor.execute([fakeEntry, entry2], { mode: 'trash' });

    expect(summary.totalAttempted).toBe(2);
    expect(summary.totalSucceeded).toBe(1);
    expect(summary.totalFailed).toBe(1);
  });
});
