import type { Platform } from '@shared/types';

export interface IPlatformAdapter {
  readonly platform: Platform;
  getScanTargets(): string[];
  hasPermission(path: string): boolean;
}

export class WindowsAdapter implements IPlatformAdapter {
  readonly platform = 'win32' as const;

  getScanTargets(): string[] {
    const localAppData = process.env.LOCALAPPDATA ?? '';
    const temp = process.env.TEMP ?? '';
    return [localAppData, temp].filter(Boolean);
  }

  hasPermission(path: string): boolean {
    return !path.includes('System32') && !path.includes('Program Files');
  }
}

export function createWindowsAdapter(): IPlatformAdapter {
  return new WindowsAdapter();
}
