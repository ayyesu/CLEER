import { createHash } from 'crypto';
import { readFile } from 'fs/promises';
import type { ClassifiedScanEntry, DuplicateGroup } from '@shared/types';

const MIN_DUPLICATE_SIZE = 1024;
const SAMPLE_SIZE = 64 * 1024;

async function quickHash(path: string): Promise<string> {
  const data = await readFile(path);
  const sample = data.subarray(0, SAMPLE_SIZE);
  return createHash('sha256').update(sample).digest('hex');
}

async function fullHash(path: string): Promise<string> {
  const data = await readFile(path);
  return createHash('sha256').update(data).digest('hex');
}

async function byteCompare(a: string, b: string): Promise<boolean> {
  const [bufA, bufB] = await Promise.all([readFile(a), readFile(b)]);
  return bufA.equals(bufB);
}

function selectKeeper(group: ClassifiedScanEntry[]): ClassifiedScanEntry {
  return group.reduce((keeper, entry) => {
    const keeperTime = keeper.lastModified?.getTime() ?? 0;
    const entryTime = entry.lastModified?.getTime() ?? 0;
    return entryTime > keeperTime ? entry : keeper;
  });
}

export interface DuplicateDetectorOptions {
  minSizeBytes?: number;
  onProgress?: (processed: number, total: number) => void;
}

export class DuplicateDetector {
  async findDuplicates(
    entries: ClassifiedScanEntry[],
    options: DuplicateDetectorOptions = {},
  ): Promise<DuplicateGroup[]> {
    const minSize = options.minSizeBytes ?? MIN_DUPLICATE_SIZE;

    const candidates = entries.filter((e) => e.sizeBytes >= minSize);

    const sizeBuckets = new Map<number, ClassifiedScanEntry[]>();
    for (const entry of candidates) {
      const bucket = sizeBuckets.get(entry.sizeBytes);
      if (bucket) bucket.push(entry);
      else sizeBuckets.set(entry.sizeBytes, [entry]);
    }

    const groups: DuplicateGroup[] = [];
    let processed = 0;
    const total = candidates.length;

    for (const [, bucket] of sizeBuckets) {
      if (bucket.length < 2) {
        processed += bucket.length;
        continue;
      }

      const quickHashes = new Map<string, ClassifiedScanEntry[]>();
      for (const entry of bucket) {
        try {
          const hash = await quickHash(entry.path);
          const existing = quickHashes.get(hash);
          if (existing) existing.push(entry);
          else quickHashes.set(hash, [entry]);
        } catch {
          // skip files we can't read
        }
        processed++;
        options.onProgress?.(processed, total);
      }

      for (const [, matches] of quickHashes) {
        if (matches.length < 2) continue;

        const fullHashes = new Map<string, ClassifiedScanEntry[]>();
        for (const entry of matches) {
          try {
            const hash = await fullHash(entry.path);
            const existing = fullHashes.get(hash);
            if (existing) existing.push(entry);
            else fullHashes.set(hash, [entry]);
          } catch {
            // skip
          }
        }

        for (const [, fullMatches] of fullHashes) {
          if (fullMatches.length < 2) continue;

          const keeper = selectKeeper(fullMatches);
          const duplicates = fullMatches.filter((e) => e.path !== keeper.path);

          const verified: ClassifiedScanEntry[] = [];
          for (const dup of duplicates) {
            try {
              if (await byteCompare(keeper.path, dup.path)) {
                verified.push({ ...dup, isDuplicateOf: keeper.path });
              }
            } catch {
              // skip
            }
          }

          if (verified.length > 0) {
            groups.push({
              keeper,
              duplicates: verified,
              sizeBytes: keeper.sizeBytes,
              wastedBytes: keeper.sizeBytes * verified.length,
            });
          }
        }
      }
    }

    return groups;
  }
}

export function createDuplicateDetector(): DuplicateDetector {
  return new DuplicateDetector();
}
