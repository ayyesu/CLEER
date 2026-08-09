import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import type { RuleDefinition } from '@shared/types';

vi.mock('worker_threads', () => {
  const EventEmitter = require('events');
  class MockWorker extends EventEmitter {
    constructor(_path: string, _options?: unknown) {
      super();
      setTimeout(() => {
        this.emit('message', { type: 'entries', data: [] });
        this.emit('message', { type: 'progress', data: { entriesFound: 0, bytesFound: 0, currentPath: '' } });
        this.emit('message', { type: 'done' });
      }, 10);
    }
    terminate() {}
    postMessage() {}
  }
  return { Worker: MockWorker, parentPort: null, workerData: {} };
});

import { createScannerEngine } from '../../src/main/services/scannerEngine';

const mockRules: RuleDefinition[] = [
  {
    id: 'npm-cache-test',
    category: 'dev-cache',
    platforms: ['darwin', 'linux', 'win32'],
    paths: ['/.npm/'],
    riskTier: 'safe',
    regenerable: true,
    description: 'npm cache',
  },
  {
    id: 'temp-files-test',
    category: 'temp',
    platforms: ['darwin', 'linux', 'win32'],
    paths: ['/tmp/', '/temp/'],
    riskTier: 'safe',
    regenerable: false,
    description: 'temp files',
  },
];

function createTestDir(): string {
  const base = mkdtempSync(join(tmpdir(), 'cleer-scanner-test-'));
  mkdirSync(join(base, '.npm', '_cacache'), { recursive: true });
  mkdirSync(join(base, 'temp'), { recursive: true });
  writeFileSync(join(base, '.npm', '_cacache', 'file1.bin'), 'x'.repeat(100));
  writeFileSync(join(base, 'temp', 'tmp1.log'), 'x'.repeat(50));
  return base;
}

function waitFor(engine: ReturnType<typeof createScannerEngine>, event: string, timeout = 2000): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Timeout waiting for ${event}`)), timeout);
    engine.once(event, (data: unknown) => {
      clearTimeout(timer);
      resolve(data);
    });
  });
}

describe('ScannerEngine', () => {
  let testDir: string;

  beforeEach(() => {
    testDir = createTestDir();
  });

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  it('starts and completes without errors', async () => {
    const engine = createScannerEngine();
    engine.setRules(mockRules);

    const errors: Error[] = [];
    engine.on('error', (err: Error) => errors.push(err));

    await engine.start({
      categories: ['dev-cache', 'temp'],
      targetPaths: [testDir],
    });

    await waitFor(engine, 'worker-done');
    expect(errors).toHaveLength(0);
  });

  it('emits worker-done when categories finish', async () => {
    const engine = createScannerEngine();
    engine.setRules(mockRules);

    await engine.start({
      categories: ['dev-cache', 'temp'],
      targetPaths: [testDir],
    });

    const done = await waitFor(engine, 'worker-done') as string;
    const done2 = await waitFor(engine, 'worker-done') as string;
    const allDone = [done, done2].sort();
    expect(allDone).toEqual(['dev-cache', 'temp']);
  });

  it('emits progress events', async () => {
    const engine = createScannerEngine();
    engine.setRules(mockRules);

    await engine.start({
      categories: ['dev-cache'],
      targetPaths: [testDir],
    });

    const progress = await waitFor(engine, 'progress') as { entriesFound: number };
    expect(typeof progress.entriesFound).toBe('number');
  });

  it('can be aborted', () => {
    const engine = createScannerEngine();
    engine.abort();
    expect(engine.isActive).toBe(false);
  });

  it('is active after start', async () => {
    const engine = createScannerEngine();
    engine.setRules(mockRules);

    await engine.start({
      categories: ['temp'],
      targetPaths: [testDir],
    });

    expect(engine.isActive).toBe(true);
  });

  it('passes scan options to workers', async () => {
    const engine = createScannerEngine();
    engine.setRules(mockRules);

    const errors: Error[] = [];
    engine.on('error', (err: Error) => errors.push(err));

    await engine.start({
      categories: ['dev-cache'],
      targetPaths: [testDir],
      maxDepth: 5,
      minSizeBytes: 1024,
    });

    await waitFor(engine, 'worker-done');
    expect(errors).toHaveLength(0);
  });
});
