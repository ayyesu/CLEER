import { describe, it, expect } from 'vitest';
import { tmpdir } from 'os';
import { join } from 'path';
import { mkdirSync, symlinkSync, rmSync } from 'fs';
import { isSystemExcluded } from '../../src/main/platform/platformExclusions';

describe('platformExclusions', () => {
  describe('win32', () => {
    it('excludes System32', () => {
      expect(isSystemExcluded('C:\\Windows\\System32\\foo.dll', 'win32')).toBe(true);
    });

    it('excludes Program Files', () => {
      expect(isSystemExcluded('C:\\Program Files\\App\\file.exe', 'win32')).toBe(true);
    });

    it('excludes Program Files (x86)', () => {
      expect(isSystemExcluded('C:\\Program Files (x86)\\App\\file.exe', 'win32')).toBe(true);
    });

    it('excludes ProgramData', () => {
      expect(isSystemExcluded('C:\\ProgramData\\App\\data.dat', 'win32')).toBe(true);
    });

    it('does not exclude user temp', () => {
      expect(isSystemExcluded('C:\\Users\\user\\AppData\\Local\\Temp\\file.tmp', 'win32')).toBe(false);
    });

    it('handles case-insensitive paths', () => {
      expect(isSystemExcluded('c:\\windows\\system32\\foo.dll', 'win32')).toBe(true);
    });

    it('handles mixed slashes', () => {
      expect(isSystemExcluded('C:/Windows/System32/foo.dll', 'win32')).toBe(true);
    });

    it('handles trailing slashes', () => {
      expect(isSystemExcluded('C:\\Windows\\System32\\', 'win32')).toBe(true);
    });
  });

  describe('darwin', () => {
    it('excludes /System', () => {
      expect(isSystemExcluded('/System/Library/Foo', 'darwin')).toBe(true);
    });

    it('excludes /usr', () => {
      expect(isSystemExcluded('/usr/bin/foo', 'darwin')).toBe(true);
    });

    it('excludes /bin', () => {
      expect(isSystemExcluded('/bin/sh', 'darwin')).toBe(true);
    });

    it('does not exclude user caches', () => {
      expect(isSystemExcluded('/Users/user/Library/Caches/foo', 'darwin')).toBe(false);
    });

    it('does not exclude home directory', () => {
      expect(isSystemExcluded('/Users/user/.npm/_cacache', 'darwin')).toBe(false);
    });
  });

  describe('linux', () => {
    it('excludes /usr', () => {
      expect(isSystemExcluded('/usr/bin/foo', 'linux')).toBe(true);
    });

    it('excludes /etc', () => {
      expect(isSystemExcluded('/etc/passwd', 'linux')).toBe(true);
    });

    it('excludes /boot', () => {
      expect(isSystemExcluded('/boot/vmlinuz', 'linux')).toBe(true);
    });

    it('does not exclude user cache', () => {
      expect(isSystemExcluded('/home/user/.cache/foo', 'linux')).toBe(false);
    });

    it('does not exclude /var/tmp', () => {
      expect(isSystemExcluded('/var/tmp/foo', 'linux')).toBe(false);
    });
  });

  describe('adversarial cases', () => {
    it('handles path traversal attempts', () => {
      expect(isSystemExcluded('/home/user/../../../etc/passwd', 'linux')).toBe(false);
    });

    it('handles empty path gracefully', () => {
      expect(isSystemExcluded('', 'linux')).toBe(false);
    });

    it('returns false for unknown platform', () => {
      expect(isSystemExcluded('/usr/bin/foo', 'freebsd')).toBe(false);
    });

    it('does not match partial directory names', () => {
      expect(isSystemExcluded('/home/user/usr-local/foo', 'linux')).toBe(false);
    });
  });

  const canSymlink = process.platform !== 'win32';

  describe('symlink resolution', () => {
    const tmp = join(tmpdir(), 'cleer-test-excl-' + Date.now());

    const testIf = canSymlink ? it : it.skip;

    testIf('resolves symlinks to excluded target', () => {
      const realDir = join(tmp, 'real-usr-bin');
      const linkDir = join(tmp, 'link-usr-bin');

      try {
        mkdirSync(realDir, { recursive: true });
        symlinkSync(realDir, linkDir);

        expect(isSystemExcluded(join(linkDir, 'foo'), 'linux')).toBe(false);
      } finally {
        rmSync(tmp, { recursive: true, force: true });
      }
    });

    testIf('resolves symlinks to non-excluded target', () => {
      const realDir = join(tmp, 'real-home');
      const linkDir = join(tmp, 'link-home');

      try {
        mkdirSync(realDir, { recursive: true });
        symlinkSync(realDir, linkDir);

        expect(isSystemExcluded(join(linkDir, 'file.txt'), 'linux')).toBe(false);
      } finally {
        rmSync(tmp, { recursive: true, force: true });
      }
    });
  });
});
