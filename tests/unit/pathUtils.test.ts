import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('fs', () => ({
  statSync: vi.fn(),
}));

import {
  normalizePathUniversal as normalizePath,
  isLongPath,
  toExtendedLengthPath,
  isOnNetworkDrive,
  isExternalDrive,
  sanitizeForLogging,
  pathsAreEqual,
  MAX_PATH_WIN32,
} from '../../src/main/platform/pathUtils';
import { statSync } from 'fs';

const mockStatSync = statSync as unknown as ReturnType<typeof vi.fn>;

describe('pathUtils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('normalizePath', () => {
    it('trims whitespace', () => {
      expect(normalizePath('  /tmp/file  ')).toBe('/tmp/file');
    });

    it('normalizes double slashes', () => {
      expect(normalizePath('/tmp//file')).toBe('/tmp/file');
    });

    it('handles non-ASCII characters', () => {
      expect(normalizePath('/tmp/文件')).toBe('/tmp/文件');
      expect(normalizePath('/tmp/fichier_éàç')).toBe('/tmp/fichier_éàç');
      expect(normalizePath('/tmp/日本語')).toBe('/tmp/日本語');
    });

    it('handles emoji in paths', () => {
      expect(normalizePath('/tmp/📁folder')).toBe('/tmp/📁folder');
    });

    it('handles CJK characters', () => {
      expect(normalizePath('/tmp/중국어')).toBe('/tmp/중국어');
      expect(normalizePath('/tmp/العربية')).toBe('/tmp/العربية');
    });

    it('handles paths with spaces', () => {
      expect(normalizePath('/tmp/my folder/file name.txt')).toBe('/tmp/my folder/file name.txt');
    });
  });

  describe('isLongPath', () => {
    it('returns false for short paths on win32', () => {
      expect(isLongPath('C:\\short\\path', 'win32')).toBe(false);
    });

    it('returns true for paths exceeding MAX_PATH on win32', () => {
      const longPath = 'C:\\' + 'a'.repeat(300);
      expect(isLongPath(longPath, 'win32')).toBe(true);
    });

    it('returns false for long paths on linux', () => {
      const longPath = '/tmp/' + 'a'.repeat(500);
      expect(isLongPath(longPath, 'linux')).toBe(false);
    });

    it('returns false for long paths on darwin', () => {
      const longPath = '/tmp/' + 'a'.repeat(500);
      expect(isLongPath(longPath, 'darwin')).toBe(false);
    });

    it('boundary: exactly MAX_PATH_WIN32 is not long', () => {
      const exactPath = 'C:\\' + 'a'.repeat(MAX_PATH_WIN32 - 4);
      expect(isLongPath(exactPath, 'win32')).toBe(false);
    });

    it('boundary: MAX_PATH_WIN32 + 1 is long', () => {
      const overPath = 'C:\\' + 'a'.repeat(MAX_PATH_WIN32 - 2);
      expect(isLongPath(overPath, 'win32')).toBe(true);
    });
  });

  describe('toExtendedLengthPath', () => {
    it('adds extended prefix to regular paths', () => {
      expect(toExtendedLengthPath('C:\\long\\path')).toBe('\\\\?\\C:\\long\\path');
    });

    it('does not double-prefix already extended paths', () => {
      expect(toExtendedLengthPath('\\\\?\\C:\\path')).toBe('\\\\?\\C:\\path');
    });

    it('handles UNC paths', () => {
      expect(toExtendedLengthPath('\\\\server\\share')).toBe('\\\\?\\UNC\\server\\share');
    });
  });

  describe('isOnNetworkDrive', () => {
    it('detects Windows UNC paths', () => {
      expect(isOnNetworkDrive('\\\\server\\file', 'win32')).toBe(true);
    });

    it('returns false for local Windows paths', () => {
      expect(isOnNetworkDrive('C:\\file', 'win32')).toBe(false);
    });

    it('detects macOS /Volumes paths', () => {
      expect(isOnNetworkDrive('/Volumes/External', 'darwin')).toBe(true);
    });

    it('returns false for macOS system volume', () => {
      expect(isOnNetworkDrive('/Volumes/Macintosh HD/Users', 'darwin')).toBe(false);
    });

    it('detects Linux /mnt paths', () => {
      expect(isOnNetworkDrive('/mnt/data', 'linux')).toBe(true);
    });

    it('detects Linux /media paths', () => {
      expect(isOnNetworkDrive('/media/usb', 'linux')).toBe(true);
    });

    it('returns false for Linux root', () => {
      expect(isOnNetworkDrive('/tmp', 'linux')).toBe(false);
    });
  });

  describe('isExternalDrive', () => {
    it('detects macOS external volumes', () => {
      expect(isExternalDrive('/Volumes/USB', 'darwin')).toBe(true);
    });

    it('returns false for macOS system volume', () => {
      expect(isExternalDrive('/Volumes/Macintosh HD', 'darwin')).toBe(false);
    });

    it('detects Linux /media paths', () => {
      expect(isExternalDrive('/media/user/USB', 'linux')).toBe(true);
    });
  });

  describe('sanitizeForLogging', () => {
    it('removes control characters', () => {
      expect(sanitizeForLogging('/tmp/file\x00name')).toBe('/tmp/file?name');
      expect(sanitizeForLogging('/tmp/file\x1fname')).toBe('/tmp/file?name');
    });

    it('keeps normal characters', () => {
      expect(sanitizeForLogging('/tmp/normal-file.txt')).toBe('/tmp/normal-file.txt');
    });

    it('keeps non-ASCII characters', () => {
      expect(sanitizeForLogging('/tmp/文件.txt')).toBe('/tmp/文件.txt');
    });
  });

  describe('pathsAreEqual', () => {
    it('is case-insensitive on win32', () => {
      expect(pathsAreEqual('C:\\File', 'c:\\file', 'win32')).toBe(true);
    });

    it('is case-insensitive on darwin', () => {
      expect(pathsAreEqual('/tmp/File', '/tmp/file', 'darwin')).toBe(true);
    });

    it('is case-sensitive on linux', () => {
      expect(pathsAreEqual('/tmp/File', '/tmp/file', 'linux')).toBe(false);
    });

    it('exact match on linux', () => {
      expect(pathsAreEqual('/tmp/file', '/tmp/file', 'linux')).toBe(true);
    });
  });
});
