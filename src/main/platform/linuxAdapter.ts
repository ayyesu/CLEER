import { join } from 'path';
import { homedir } from 'os';
import type { Platform } from '@shared/types';

export interface IPlatformAdapter {
  readonly platform: Platform;
  getScanTargets(): string[];
  hasPermission(path: string): boolean;
}

export class LinuxAdapter implements IPlatformAdapter {
  readonly platform = 'linux' as const;

  getScanTargets(): string[] {
    const home = homedir();
    return [join(home, '.cache'), '/var/cache'];
  }

  hasPermission(path: string): boolean {
    return !path.startsWith('/usr') && !path.startsWith('/System');
  }
}

export function createLinuxAdapter(): IPlatformAdapter {
  return new LinuxAdapter();
}
