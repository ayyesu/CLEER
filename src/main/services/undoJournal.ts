import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
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

function readAll(): UndoJournalEntry[] {
  if (!existsSync(JOURNAL_FILE)) return [];
  const content = readFileSync(JOURNAL_FILE, 'utf-8');
  return content
    .split('\n')
    .filter((line) => line.trim())
    .map((line) => JSON.parse(line) as UndoJournalEntry);
}

function writeAll(entries: UndoJournalEntry[]): void {
  ensureDir();
  const content = entries.map((e) => JSON.stringify(e)).join('\n') + '\n';
  writeFileSync(JOURNAL_FILE, content, 'utf-8');
}

export async function writeUndoJournal(entries: UndoJournalEntry[]): Promise<void> {
  ensureDir();
  const lines = entries.map((e) => JSON.stringify(e)).join('\n') + '\n';
  appendFileSync(JOURNAL_FILE, lines, 'utf-8');
}

export function readUndoJournal(): UndoJournalEntry[] {
  return readAll();
}

export function getJournalEntry(id: string): UndoJournalEntry | undefined {
  return readAll().find((e) => e.id === id);
}

export function updateJournalEntry(id: string, updates: Partial<UndoJournalEntry>): void {
  const entries = readAll();
  const idx = entries.findIndex((e) => e.id === id);
  if (idx === -1) return;
  entries[idx] = { ...entries[idx], ...updates };
  writeAll(entries);
}

export function clearJournal(): void {
  if (existsSync(JOURNAL_FILE)) {
    writeFileSync(JOURNAL_FILE, '', 'utf-8');
  }
}
