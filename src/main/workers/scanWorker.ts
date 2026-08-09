import { parentPort, workerData } from 'worker_threads';
import { readdirSync, lstatSync } from 'fs';
import { join } from 'path';
import type { ScanEntry } from '@shared/types';
import { isSystemExcluded } from '../platform/platformExclusions';

interface WorkerData {
  category: string;
  targetPaths: string[];
  options: { maxDepth?: number; minSizeBytes?: number };
}

const { category, targetPaths, options } = workerData as WorkerData;

function walkDir(dir: string, depth: number): void {
  if (options.maxDepth && depth > options.maxDepth) return;
  if (isSystemExcluded(dir, process.platform)) return;

  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return;
  }

  for (const entry of entries) {
    const fullPath = join(dir, entry);

    let stats;
    try {
      stats = lstatSync(fullPath);
    } catch {
      continue;
    }

    if (stats.isDirectory()) {
      walkDir(fullPath, depth + 1);
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

    parentPort?.postMessage([scanEntry]);
  }
}

for (const target of targetPaths) {
  walkDir(target, 0);
}

parentPort?.close();
