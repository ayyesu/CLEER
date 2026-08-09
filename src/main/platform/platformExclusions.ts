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

export function isSystemExcluded(path: string, platform: string): boolean {
  const resolved = resolveRealPath(path);
  const normalized = normalizeForComparison(resolved);

  switch (platform) {
    case 'win32':
      return SYSTEM_EXCLUSIONS_WIN.some((ex) =>
        normalized.startsWith(normalizeForComparison(ex)),
      );
    case 'darwin':
      return SYSTEM_EXCLUSIONS_MAC.some((ex) =>
        normalized.startsWith(normalizeForComparison(ex)),
      );
    case 'linux':
      return SYSTEM_EXCLUSIONS_LINUX.some((ex) =>
        normalized.startsWith(normalizeForComparison(ex)),
      );
    default:
      return false;
  }
}
