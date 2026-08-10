import { normalize } from 'path';
import { statSync } from 'fs';

export const MAX_PATH_WIN32 = 260;
export const MAX_PATH_WIN32_EXTENDED = 32767;

export function normalizePath(input: string): string {
  let p = input.trim();
  p = normalize(p);
  return p;
}

export function normalizePathUniversal(input: string): string {
  return input.trim().replace(/\/+/g, '/').replace(/\\+/g, '/');
}

export function isLongPath(path: string, platform: string): boolean {
  if (platform === 'win32') {
    return path.length > MAX_PATH_WIN32;
  }
  return false;
}

export function toExtendedLengthPath(path: string): string {
  if (path.startsWith('\\\\?\\')) return path;
  if (path.startsWith('\\\\')) {
    return '\\\\?\\UNC\\' + path.slice(2);
  }
  return '\\\\?\\' + path;
}

export function isOnNetworkDrive(path: string, platform: string): boolean {
  if (platform === 'win32') {
    return path.startsWith('\\\\');
  }
  if (platform === 'darwin') {
    return path.startsWith('/Volumes/') && !path.startsWith('/Volumes/Macintosh HD');
  }
  if (platform === 'linux') {
    return path.startsWith('/mnt/') || path.startsWith('/media/');
  }
  return false;
}

export function isExternalDrive(path: string, platform: string): boolean {
  if (platform === 'win32') {
    try {
      const stat = statSync(path.charAt(0) + ':\\');
      return !!stat;
    } catch {
      return false;
    }
  }
  if (platform === 'darwin') {
    return path.startsWith('/Volumes/') && !path.startsWith('/Volumes/Macintosh HD');
  }
  if (platform === 'linux') {
    return path.startsWith('/media/');
  }
  return false;
}

export function sanitizeForLogging(path: string): string {
  return path.replace(/[\u0000-\u001f\u007f]/g, '?');
}

export function pathsAreEqual(a: string, b: string, platform: string): boolean {
  if (platform === 'win32' || platform === 'darwin') {
    return a.toLowerCase() === b.toLowerCase();
  }
  return a === b;
}
