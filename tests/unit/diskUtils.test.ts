import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('fs', () => ({
  statfsSync: vi.fn(),
}));

import {
  getDiskSpace,
  isDiskSpaceLow,
  isDiskSpaceCritical,
  canWriteJournal,
  formatDiskSpace,
  LOW_DISK_THRESHOLD_PERCENT,
  CRITICAL_DISK_THRESHOLD_PERCENT,
} from '../../src/main/platform/diskUtils';
import { statfsSync } from 'fs';

const mockStatfsSync = statfsSync as unknown as ReturnType<typeof vi.fn>;

describe('diskUtils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getDiskSpace', () => {
    it('returns disk space info', () => {
      mockStatfsSync.mockReturnValue({
        blocks: 1000000,
        bfree: 250000,
        bavail: 200000,
        bsize: 4096,
      });

      const info = getDiskSpace('/');

      expect(info).not.toBeNull();
      expect(info!.totalBytes).toBe(1000000 * 4096);
      expect(info!.freeBytes).toBe(250000 * 4096);
      expect(info!.availableBytes).toBe(200000 * 4096);
      expect(info!.usagePercent).toBeCloseTo(75, 0);
    });

    it('returns null on error', () => {
      mockStatfsSync.mockImplementation(() => { throw new Error('ENOENT'); });

      expect(getDiskSpace('/nonexistent')).toBeNull();
    });
  });

  describe('isDiskSpaceLow', () => {
    it('returns false when usage is below threshold', () => {
      mockStatfsSync.mockReturnValue({
        blocks: 1000000,
        bfree: 200000,
        bavail: 150000,
        bsize: 4096,
      });

      expect(isDiskSpaceLow('/')).toBe(false);
    });

    it('returns true when usage exceeds threshold', () => {
      mockStatfsSync.mockReturnValue({
        blocks: 1000000,
        bfree: 50000,
        bavail: 40000,
        bsize: 4096,
      });

      expect(isDiskSpaceLow('/')).toBe(true);
    });
  });

  describe('isDiskSpaceCritical', () => {
    it('returns false when usage is below critical threshold', () => {
      mockStatfsSync.mockReturnValue({
        blocks: 1000000,
        bfree: 60000,
        bavail: 50000,
        bsize: 4096,
      });

      expect(isDiskSpaceCritical('/')).toBe(false);
    });

    it('returns true when usage exceeds critical threshold', () => {
      mockStatfsSync.mockReturnValue({
        blocks: 1000000,
        bfree: 30000,
        bavail: 20000,
        bsize: 4096,
      });

      expect(isDiskSpaceCritical('/')).toBe(true);
    });
  });

  describe('canWriteJournal', () => {
    it('returns true when enough space', () => {
      mockStatfsSync.mockReturnValue({
        blocks: 1000000,
        bfree: 250000,
        bavail: 200000,
        bsize: 4096,
      });

      expect(canWriteJournal('/')).toBe(true);
    });

    it('returns false when disk is almost full', () => {
      mockStatfsSync.mockReturnValue({
        blocks: 1000000,
        bfree: 100,
        bavail: 50,
        bsize: 4096,
      });

      expect(canWriteJournal('/')).toBe(false);
    });

    it('returns true when stat fails (optimistic)', () => {
      mockStatfsSync.mockImplementation(() => { throw new Error('ENOENT'); });

      expect(canWriteJournal('/nonexistent')).toBe(true);
    });
  });

  describe('formatDiskSpace', () => {
    it('formats bytes correctly', () => {
      expect(formatDiskSpace(0)).toBe('0 B');
      expect(formatDiskSpace(1024)).toBe('1.0 KB');
      expect(formatDiskSpace(1024 * 1024)).toBe('1.0 MB');
      expect(formatDiskSpace(1024 * 1024 * 1024)).toBe('1.0 GB');
      expect(formatDiskSpace(1536)).toBe('1.5 KB');
    });
  });
});
