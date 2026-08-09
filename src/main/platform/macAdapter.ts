import { join } from 'path';
import { homedir } from 'os';
import type { Platform } from '@shared/types';

export interface IPlatformAdapter {
  readonly platform: Platform;
  getScanTargets(): string[];
  hasPermission(path: string): boolean;
}

export class MacAdapter implements IPlatformAdapter {
  readonly platform = 'darwin' as const;

  getScanTargets(): string[] {
    const home = homedir();
    return [
      join(home, 'Library', 'Caches'),
      join(home, 'Library', 'Logs'),
    ];
  }

  hasPermission(path: string): boolean {
    return !path.startsWith('/System') && !path.startsWith('/usr');
  }
}

export function createMacAdapter(): IPlatformAdapter {
  return new MacAdapter();
}
