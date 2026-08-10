import { statfsSync } from 'fs';

export interface DiskSpaceInfo {
  totalBytes: number;
  freeBytes: number;
  availableBytes: number;
  usagePercent: number;
}

export const LOW_DISK_THRESHOLD_PERCENT = 90;
export const CRITICAL_DISK_THRESHOLD_PERCENT = 95;
export const MIN_FREE_BYTES_FOR_JOURNAL = 1024 * 1024;

export function getDiskSpace(path: string): DiskSpaceInfo | null {
  try {
    const stat = statfsSync(path);
    const totalBytes = stat.blocks * stat.bsize;
    const freeBytes = stat.bfree * stat.bsize;
    const availableBytes = stat.bavail * stat.bsize;
    const usagePercent = totalBytes > 0 ? ((totalBytes - freeBytes) / totalBytes) * 100 : 0;

    return { totalBytes, freeBytes, availableBytes, usagePercent };
  } catch {
    return null;
  }
}

export function isDiskSpaceLow(path: string): boolean {
  const info = getDiskSpace(path);
  if (!info) return false;
  return info.usagePercent >= LOW_DISK_THRESHOLD_PERCENT;
}

export function isDiskSpaceCritical(path: string): boolean {
  const info = getDiskSpace(path);
  if (!info) return false;
  return info.usagePercent >= CRITICAL_DISK_THRESHOLD_PERCENT;
}

export function canWriteJournal(path: string): boolean {
  const info = getDiskSpace(path);
  if (!info) return true;
  return info.freeBytes >= MIN_FREE_BYTES_FOR_JOURNAL;
}

export function formatDiskSpace(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}
