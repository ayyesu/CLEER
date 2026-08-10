import { execSync } from 'child_process';
import { accessSync, constants, statSync } from 'fs';
import { homedir } from 'os';
import type { PermissionStatus, Platform } from '@shared/types';

function canAccessDir(dir: string): boolean {
  try {
    accessSync(dir, constants.R_OK);
    return true;
  } catch {
    return false;
  }
}

function canWriteDir(dir: string): boolean {
  try {
    accessSync(dir, constants.W_OK);
    return true;
  } catch {
    return false;
  }
}

function checkMacFullDiskAccess(): { hasAccess: boolean; inaccessiblePaths: string[] } {
  const testPaths = [
    `${homedir()}/Library/Mail`,
    `${homedir()}/Library/Safari`,
    `${homedir()}/Library/Application Support/Google/Chrome`,
    '/Library/Application Support',
  ];

  const inaccessiblePaths: string[] = [];

  for (const p of testPaths) {
    try {
      statSync(p);
    } catch (err) {
      const code = (err as NodeJS.ErrnoException).code;
      if (code === 'EACCES' || code === 'EPERM') {
        inaccessiblePaths.push(p);
      }
    }
  }

  const hasAccess = inaccessiblePaths.length === 0;

  return { hasAccess, inaccessiblePaths };
}

function checkWindowsElevation(): { isElevated: boolean; inaccessiblePaths: string[] } {
  const inaccessiblePaths: string[] = [];

  try {
    execSync('net session', { stdio: 'ignore' });
    return { isElevated: true, inaccessiblePaths };
  } catch {
    const systemPaths = [
      'C:\\Windows\\System32\\config',
      'C:\\ProgramData\\Microsoft\\Windows',
    ];

    for (const p of systemPaths) {
      try {
        accessSync(p, constants.R_OK);
      } catch {
        inaccessiblePaths.push(p);
      }
    }

    return { isElevated: false, inaccessiblePaths };
  }
}

function checkLinuxPermissions(): { isRoot: boolean; inaccessiblePaths: string[] } {
  const inaccessiblePaths: string[] = [];
  const isRoot = (process.getuid?.() ?? 1000) === 0;

  if (!isRoot) {
    const restrictedPaths = [
      '/root',
      '/etc/shadow',
      '/var/log',
    ];

    for (const p of restrictedPaths) {
      try {
        accessSync(p, constants.R_OK);
      } catch {
        inaccessiblePaths.push(p);
      }
    }
  }

  return { isRoot, inaccessiblePaths };
}

export function detectPermissions(platform: Platform): PermissionStatus {
  const homeDir = homedir();
  const canScanHome = canAccessDir(homeDir);
  const canWriteTrash = canWriteDir(homeDir);
  const warnings: string[] = [];
  const inaccessiblePaths: string[] = [];

  let level: PermissionStatus['level'] = 'full';
  let canScanSystem = true;
  let actionable = false;
  let actionLabel: string | undefined;
  let actionDescription: string | undefined;

  switch (platform) {
    case 'darwin': {
      const macResult = checkMacFullDiskAccess();

      if (!macResult.hasAccess) {
        level = 'partial';
        canScanSystem = false;
        actionable = true;
        actionLabel = 'Grant Full Disk Access';
        actionDescription =
          'CLEER needs Full Disk Access to scan all directories. Open System Settings → Privacy & Security → Full Disk Access, then add CLEER.';
        inaccessiblePaths.push(...macResult.inaccessiblePaths);
        warnings.push(
          'Full Disk Access not granted. Some directories will be skipped during scanning.',
        );
      }
      break;
    }

    case 'win32': {
      const winResult = checkWindowsElevation();

      if (!winResult.isElevated) {
        level = 'partial';
        actionable = true;
        actionLabel = 'Run as Administrator (optional)';
        actionDescription =
          'Running without administrator privileges means some system directories will be skipped. You can still scan user directories.';
        inaccessiblePaths.push(...winResult.inaccessiblePaths);
        warnings.push(
          'Not running as administrator. Some system directories will be skipped.',
        );
      }
      break;
    }

    case 'linux': {
      const linuxResult = checkLinuxPermissions();

      if (!linuxResult.isRoot) {
        level = 'partial';
        actionable = true;
        actionLabel = 'Run with elevated privileges (optional)';
        actionDescription =
          'Running without root access means system directories like /root and /var/log will be skipped.';
        inaccessiblePaths.push(...linuxResult.inaccessiblePaths);
        warnings.push(
          'Not running as root. Some system directories will be skipped.',
        );
      }
      break;
    }
  }

  if (!canScanHome) {
    level = 'restricted';
    warnings.push('Cannot read home directory. Scanning will be very limited.');
  }

  if (!canWriteTrash) {
    warnings.push('Cannot write to trash location. Deletion may fail.');
  }

  return {
    platform,
    level,
    canScanSystem,
    canScanHome,
    canWriteTrash,
    inaccessiblePaths,
    warnings,
    actionable,
    actionLabel,
    actionDescription,
  };
}

export function createPermissionsService() {
  return { detectPermissions };
}
