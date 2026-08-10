import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('child_process', () => ({
  execSync: vi.fn(),
}));

vi.mock('fs', () => ({
  accessSync: vi.fn(),
  constants: { R_OK: 4, W_OK: 2 },
  statSync: vi.fn(),
}));

vi.mock('os', () => ({
  homedir: () => '/home/testuser',
}));

import { detectPermissions } from '../../src/main/services/permissionsService';
import { accessSync, statSync } from 'fs';
import { execSync } from 'child_process';

const mockAccessSync = accessSync as unknown as ReturnType<typeof vi.fn>;
const mockStatSync = statSync as unknown as ReturnType<typeof vi.fn>;
const mockExecSync = execSync as unknown as ReturnType<typeof vi.fn>;

describe('permissionsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (process as { getuid?: () => number }).getuid = vi.fn(() => 1000);
  });

  describe('linux', () => {
    it('returns full permissions when running as root', () => {
      (process as { getuid?: () => number }).getuid = vi.fn(() => 0);
      mockAccessSync.mockImplementation(() => undefined);

      const status = detectPermissions('linux');

      expect(status.platform).toBe('linux');
      expect(status.level).toBe('full');
      expect(status.canScanSystem).toBe(true);
    });

    it('returns partial permissions when not root', () => {
      (process as { getuid?: () => number }).getuid = vi.fn(() => 1000);
      mockAccessSync.mockImplementation(() => undefined);

      const status = detectPermissions('linux');

      expect(status.platform).toBe('linux');
      expect(status.level).toBe('partial');
      expect(status.warnings.length).toBeGreaterThan(0);
      expect(status.actionable).toBe(true);
    });

    it('detects inaccessible paths for non-root users', () => {
      (process as { getuid?: () => number }).getuid = vi.fn(() => 1000);
      mockAccessSync.mockImplementation((path: string) => {
        if (path.includes('/root') || path.includes('/etc/shadow')) {
          throw new Error('EACCES');
        }
      });

      const status = detectPermissions('linux');

      expect(status.inaccessiblePaths.length).toBeGreaterThan(0);
    });
  });

  describe('darwin', () => {
    it('returns full permissions when FDA granted', () => {
      mockAccessSync.mockImplementation(() => undefined);
      mockStatSync.mockImplementation(() => undefined);

      const status = detectPermissions('darwin');

      expect(status.platform).toBe('darwin');
      expect(status.canScanSystem).toBe(true);
    });

    it('detects missing Full Disk Access', () => {
      mockAccessSync.mockImplementation(() => undefined);
      mockStatSync.mockImplementation(() => {
        const err = new Error('EACCES') as NodeJS.ErrnoException;
        err.code = 'EACCES';
        throw err;
      });

      const status = detectPermissions('darwin');

      expect(status.platform).toBe('darwin');
      expect(status.canScanSystem).toBe(false);
      expect(status.actionable).toBe(true);
      expect(status.actionLabel).toContain('Full Disk Access');
      expect(status.warnings.length).toBeGreaterThan(0);
    });
  });

  describe('win32', () => {
    it('returns full permissions when elevated', () => {
      mockExecSync.mockImplementation(() => undefined);
      mockAccessSync.mockImplementation(() => undefined);

      const status = detectPermissions('win32');

      expect(status.platform).toBe('win32');
      expect(status.level).toBe('full');
    });

    it('returns partial permissions when not elevated', () => {
      mockExecSync.mockImplementation(() => { throw new Error('access denied'); });
      mockAccessSync.mockImplementation(() => undefined);

      const status = detectPermissions('win32');

      expect(status.platform).toBe('win32');
      expect(status.level).toBe('partial');
      expect(status.actionable).toBe(true);
      expect(status.warnings.length).toBeGreaterThan(0);
    });
  });

  describe('common', () => {
    it('detects restricted level when home directory is unreadable', () => {
      mockAccessSync.mockImplementation(() => {
        const err = new Error('EACCES') as NodeJS.ErrnoException;
        err.code = 'EACCES';
        throw err;
      });
      mockStatSync.mockImplementation(() => {
        const err = new Error('EACCES') as NodeJS.ErrnoException;
        err.code = 'EACCES';
        throw err;
      });

      const status = detectPermissions('linux');

      expect(status.canScanHome).toBe(false);
      expect(status.level).toBe('restricted');
    });

    it('includes actionable flag with label when permissions can be improved', () => {
      mockAccessSync.mockImplementation(() => undefined);
      mockStatSync.mockImplementation(() => {
        const err = new Error('EACCES') as NodeJS.ErrnoException;
        err.code = 'EACCES';
        throw err;
      });

      const status = detectPermissions('darwin');

      expect(status.actionable).toBe(true);
      expect(status.actionLabel).toBeDefined();
      expect(status.actionDescription).toBeDefined();
    });

    it('provides action description explaining how to grant access', () => {
      mockAccessSync.mockImplementation(() => undefined);
      mockStatSync.mockImplementation(() => {
        const err = new Error('EACCES') as NodeJS.ErrnoException;
        err.code = 'EACCES';
        throw err;
      });

      const status = detectPermissions('darwin');

      expect(status.actionDescription!).toContain('System Settings');
    });
  });
});
