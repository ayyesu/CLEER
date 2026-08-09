import { realpathSync } from 'fs';

const SYSTEM_EXCLUSIONS_WIN = [
  'C:\\Windows',
  'C:\\Program Files',
  'C:\\Program Files (x86)',
  'C:\\ProgramData',
];

const SYSTEM_EXCLUSIONS_MAC = [
  '/System',
  '/usr',
  '/bin',
  '/sbin',
  '/private/var/db',
  '/.Spotlight-V100',
];

const SYSTEM_EXCLUSIONS_LINUX = [
  '/usr',
  '/bin',
  '/sbin',
  '/lib',
  '/lib64',
  '/etc',
  '/boot',
  '/proc',
  '/sys',
  '/dev',
];

function normalizeForComparison(input: string): string {
  let p = input.replace(/\\/g, '/');
  p = p.replace(/\/+$/, '');
  p = p.toLowerCase();
  return p;
}

function resolveRealPath(input: string): string {
  try {
    return realpathSync(input);
  } catch {
    return input;
  }
}

function matchesExclusions(normalized: string, exclusions: string[]): boolean {
  return exclusions.some((ex) => normalized.startsWith(normalizeForComparison(ex)));
}

export function isSystemExcluded(path: string, platform: string): boolean {
  const normalized = normalizeForComparison(path);
  const resolved = normalizeForComparison(resolveRealPath(path));

  switch (platform) {
    case 'win32':
      return matchesExclusions(normalized, SYSTEM_EXCLUSIONS_WIN) ||
             matchesExclusions(resolved, SYSTEM_EXCLUSIONS_WIN);
    case 'darwin':
      return matchesExclusions(normalized, SYSTEM_EXCLUSIONS_MAC) ||
             matchesExclusions(resolved, SYSTEM_EXCLUSIONS_MAC);
    case 'linux':
      return matchesExclusions(normalized, SYSTEM_EXCLUSIONS_LINUX) ||
             matchesExclusions(resolved, SYSTEM_EXCLUSIONS_LINUX);
    default:
      return false;
  }
}
