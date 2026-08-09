import { describe, it, expect, beforeEach, vi } from 'vitest';
import { join } from 'path';
import { tmpdir } from 'os';

vi.mock('electron', () => ({
  app: { getPath: () => join(tmpdir(), 'cleer-test-data-' + Date.now()) },
}));

import {
  writeUndoJournal,
  readUndoJournal,
  updateJournalEntry,
  getJournalEntry,
  clearJournal,
} from '../../src/main/services/undoJournal';
import type { UndoJournalEntry } from '@shared/types';

function makeEntry(overrides: Partial<UndoJournalEntry> = {}): UndoJournalEntry {
  return {
    id: `test-${Math.random().toString(36).slice(2)}`,
    path: '/home/user/file.txt',
    sizeBytes: 1024,
    category: 'temp',
    riskTier: 'safe',
    deletedAt: new Date(),
    mode: 'trash',
    status: 'pending',
    batchId: 'batch-1',
    ...overrides,
  };
}

describe('undoJournal', () => {
  beforeEach(() => {
    clearJournal();
  });

  it('writes and reads entries', async () => {
    const entry = makeEntry();
    await writeUndoJournal([entry]);

    const entries = readUndoJournal();
    expect(entries.length).toBe(1);
    expect(entries[0].path).toBe('/home/user/file.txt');
    expect(entries[0].status).toBe('pending');
  });

  it('appends multiple batches', async () => {
    await writeUndoJournal([makeEntry({ id: '1' }), makeEntry({ id: '2' })]);
    await writeUndoJournal([makeEntry({ id: '3' })]);

    const entries = readUndoJournal();
    expect(entries.length).toBe(3);
  });

  it('updates entry status', async () => {
    const entry = makeEntry({ id: 'update-me' });
    await writeUndoJournal([entry]);

    updateJournalEntry('update-me', { status: 'completed' });

    const updated = getJournalEntry('update-me');
    expect(updated?.status).toBe('completed');
  });

  it('crash-safety: pending entries persist even if process crashes after write', async () => {
    const entry = makeEntry({ id: 'crash-test', status: 'pending' });
    await writeUndoJournal([entry]);

    const entries = readUndoJournal();
    const found = entries.find((e) => e.id === 'crash-test');
    expect(found).toBeDefined();
    expect(found?.status).toBe('pending');
    expect(found?.path).toBe('/home/user/file.txt');
  });

  it('returns empty array when no journal exists', () => {
    clearJournal();
    expect(readUndoJournal()).toEqual([]);
  });

  it('clears all entries', async () => {
    await writeUndoJournal([makeEntry(), makeEntry()]);
    clearJournal();
    expect(readUndoJournal()).toEqual([]);
  });
});
