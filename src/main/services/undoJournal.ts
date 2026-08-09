import { appendFileSync, existsSync, mkdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { app } from 'electron';
import type { UndoJournalEntry } from '@shared/types';

const JOURNAL_DIR = join(app.getPath('userData'), 'undo-journal');
const JOURNAL_FILE = join(JOURNAL_DIR, 'journal.jsonl');

function ensureDir(): void {
  if (!existsSync(JOURNAL_DIR)) {
    mkdirSync(JOURNAL_DIR, { recursive: true });
  }
}

export async function writeUndoJournal(entries: UndoJournalEntry[]): Promise<void> {
  ensureDir();
  const lines = entries.map((e) => JSON.stringify(e)).join('\n') + '\n';
  appendFileSync(JOURNAL_FILE, lines, 'utf-8');
}

export function readUndoJournal(): UndoJournalEntry[] {
  if (!existsSync(JOURNAL_FILE)) return [];
  const content = readFileSync(JOURNAL_FILE, 'utf-8');
  return content
    .split('\n')
    .filter((line) => line.trim())
    .map((line) => JSON.parse(line) as UndoJournalEntry);
}
