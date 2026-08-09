import { parentPort, workerData } from 'worker_threads';
import { readdir, lstat } from 'fs/promises';
import { join } from 'path';
import type { ScanEntry } from '@shared/types';
import { isSystemExcluded } from '../platform/platformExclusions';

interface WorkerData {
  category: string;
  targetPaths: string[];
  options: { maxDepth?: number; minSizeBytes?: number };
}

const { category, targetPaths, options } = workerData as WorkerData;

const BATCH_SIZE = 50;
const PROGRESS_INTERVAL_MS = 250;

let batch: ScanEntry[] = [];
let entriesFound = 0;
let bytesFound = 0;
let currentPath = '';
let progressTimer: NodeJS.Timeout | null = null;

function flushBatch(): void {
  if (batch.length === 0) return;
  parentPort?.postMessage({ type: 'entries', data: batch });
  batch = [];
}

function reportProgress(): void {
  parentPort?.postMessage({
    type: 'progress',
    data: { entriesFound, bytesFound, currentPath },
  });
}

function startProgressTimer(): void {
  progressTimer = setInterval(reportProgress, PROGRESS_INTERVAL_MS);
}

function stopProgressTimer(): void {
  if (progressTimer) {
    clearInterval(progressTimer);
    progressTimer = null;
  }
}

async function walkDir(dir: string, depth: number): Promise<void> {
  if (options.maxDepth && depth > options.maxDepth) return;
  if (isSystemExcluded(dir, process.platform)) return;

  currentPath = dir;

  let entries: string[];
  try {
    entries = await readdir(dir);
  } catch {
    return;
  }

  for (const entry of entries) {
    if (parentPort === null) return;

    const fullPath = join(dir, entry);

    let stats;
    try {
      stats = await lstat(fullPath);
    } catch {
      continue;
    }

    if (stats.isDirectory()) {
      await walkDir(fullPath, depth + 1);
      continue;
    }

    if (!stats.isFile()) continue;

    if (options.minSizeBytes && stats.size < options.minSizeBytes) continue;

    const scanEntry: ScanEntry = {
      path: fullPath,
      sizeBytes: stats.size,
      kind: 'file',
      category: category as ScanEntry['category'],
      lastAccessed: stats.atime,
      lastModified: stats.mtime,
    };

    batch.push(scanEntry);
    entriesFound++;
    bytesFound += stats.size;

    if (batch.length >= BATCH_SIZE) {
      flushBatch();
    }
  }
}

async function main(): Promise<void> {
  startProgressTimer();

  for (const target of targetPaths) {
    await walkDir(target, 0);
  }

  flushBatch();
  stopProgressTimer();
  reportProgress();

  parentPort?.postMessage({ type: 'done' });
}

main().catch((err) => {
  parentPort?.postMessage({ type: 'error', data: String(err) });
});
