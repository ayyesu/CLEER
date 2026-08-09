import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, writeFileSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { createDuplicateDetector } from '../../src/main/services/duplicateDetector';
import type { ClassifiedScanEntry } from '@shared/types';

function makeEntry(path: string, size: number, content: string): ClassifiedScanEntry {
  writeFileSync(path, content);
  return {
    path,
    sizeBytes: size,
    kind: 'file',
    category: 'temp',
    riskTier: 'safe',
    regenerable: false,
    lastModified: new Date(),
  };
}

describe('DuplicateDetector', () => {
  let testDir: string;

  beforeEach(() => {
    testDir = mkdtempSync(join(tmpdir(), 'cleer-dedupe-test-'));
  });

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  it('finds identical files as duplicates', async () => {
    const content = 'duplicate content for test '.repeat(60);
    const entries = [
      makeEntry(join(testDir, 'file1.txt'), content.length, content),
      makeEntry(join(testDir, 'file2.txt'), content.length, content),
      makeEntry(join(testDir, 'unique.txt'), 2000, 'unique content here '.repeat(100)),
    ];

    const detector = createDuplicateDetector();
    const groups = await detector.findDuplicates(entries);

    expect(groups.length).toBe(1);
    expect(groups[0].duplicates.length).toBe(1);
    expect(groups[0].sizeBytes).toBe(content.length);
    expect(groups[0].wastedBytes).toBe(content.length);
  });

  it('does not flag unique files as duplicates', async () => {
    const entries = [
      makeEntry(join(testDir, 'a.txt'), 2000, 'unique content A '.repeat(120)),
      makeEntry(join(testDir, 'b.txt'), 2000, 'unique content B '.repeat(120)),
      makeEntry(join(testDir, 'c.txt'), 2000, 'unique content C '.repeat(120)),
    ];

    const detector = createDuplicateDetector();
    const groups = await detector.findDuplicates(entries);

    expect(groups.length).toBe(0);
  });

  it('groups multiple copies correctly', async () => {
    const content = 'same content data for testing duplicates '.repeat(50);
    const entries = [
      makeEntry(join(testDir, 'copy1.txt'), content.length, content),
      makeEntry(join(testDir, 'copy2.txt'), content.length, content),
      makeEntry(join(testDir, 'copy3.txt'), content.length, content),
    ];

    const detector = createDuplicateDetector();
    const groups = await detector.findDuplicates(entries);

    expect(groups.length).toBe(1);
    expect(groups[0].duplicates.length).toBe(2);
    expect(groups[0].wastedBytes).toBe(content.length * 2);
  });

  it('keeps newest file as keeper', async () => {
    const content = 'identical content for keeper test '.repeat(50);
    const entry1 = makeEntry(join(testDir, 'old.txt'), content.length, content);
    entry1.lastModified = new Date('2020-01-01');
    const entry2 = makeEntry(join(testDir, 'new.txt'), content.length, content);
    entry2.lastModified = new Date('2024-01-01');

    const detector = createDuplicateDetector();
    const groups = await detector.findDuplicates([entry1, entry2]);

    expect(groups.length).toBe(1);
    expect(groups[0].keeper.path).toBe(join(testDir, 'new.txt'));
  });

  it('respects minSizeBytes filter', async () => {
    const small = 'x'.repeat(100);
    const entries = [
      makeEntry(join(testDir, 'small1.txt'), small.length, small),
      makeEntry(join(testDir, 'small2.txt'), small.length, small),
    ];

    const detector = createDuplicateDetector();
    const groups = await detector.findDuplicates(entries, { minSizeBytes: 1024 });

    expect(groups.length).toBe(0);
  });

  it('does not flag same-size different-content as duplicate', async () => {
    const entries = [
      makeEntry(join(testDir, 'a.txt'), 2000, 'content-A-different '.repeat(100)),
      makeEntry(join(testDir, 'b.txt'), 2000, 'content-B-different '.repeat(100)),
    ];

    const detector = createDuplicateDetector();
    const groups = await detector.findDuplicates(entries);

    expect(groups.length).toBe(0);
  });

  it('calls onProgress callback', async () => {
    const content = 'progress test for duplicate detection callback '.repeat(50);
    const entries = [
      makeEntry(join(testDir, 'p1.txt'), content.length, content),
      makeEntry(join(testDir, 'p2.txt'), content.length, content),
    ];

    const progressCalls: Array<{ processed: number; total: number }> = [];
    const detector = createDuplicateDetector();
    await detector.findDuplicates(entries, {
      onProgress: (processed, total) => progressCalls.push({ processed, total }),
    });

    expect(progressCalls.length).toBeGreaterThan(0);
  });
});
