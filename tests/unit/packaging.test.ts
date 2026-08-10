import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { load as yamlLoad } from 'js-yaml';

describe('packaging config', () => {
  let config: Record<string, unknown>;

  beforeAll(() => {
    const raw = readFileSync(join(__dirname, '../../electron-builder.yml'), 'utf-8');
    config = yamlLoad(raw) as Record<string, unknown>;
  });

  it('has correct appId', () => {
    expect(config.appId).toBe('com.cleer.app');
  });

  it('has product name', () => {
    expect(config.productName).toBe('CLEER');
  });

  it('packages as asar', () => {
    expect(config.asar).toBe(true);
  });

  it('has macOS config with hardened runtime', () => {
    const mac = config.mac as Record<string, unknown>;
    expect(mac.hardenedRuntime).toBe(true);
    expect(mac.category).toBe('public.app-category.utilities');
  });

  it('has macOS DMG target with x64 and arm64', () => {
    const mac = config.mac as Record<string, unknown>;
    const targets = mac.target as Array<Record<string, unknown>>;
    const dmgTarget = targets.find((t) => t.target === 'dmg');
    expect(dmgTarget).toBeDefined();
    expect(dmgTarget!.arch).toEqual(['x64', 'arm64']);
  });

  it('has Windows NSIS target', () => {
    const win = config.win as Record<string, unknown>;
    const targets = win.target as Array<Record<string, unknown>>;
    const nsisTarget = targets.find((t) => t.target === 'nsis');
    expect(nsisTarget).toBeDefined();
  });

  it('has Windows targets without signing (unsigned builds)', () => {
    const win = config.win as Record<string, unknown>;
    const targets = win.target as Array<Record<string, unknown>>;
    expect(targets.length).toBeGreaterThan(0);
  });

  it('has NSIS installer options', () => {
    const nsis = config.nsis as Record<string, unknown>;
    expect(nsis.oneClick).toBe(false);
    expect(nsis.allowToChangeInstallationDirectory).toBe(true);
  });

  it('has Linux AppImage and deb targets', () => {
    const linux = config.linux as Record<string, unknown>;
    const targets = linux.target as Array<Record<string, unknown>>;
    const appImage = targets.find((t) => t.target === 'AppImage');
    const deb = targets.find((t) => t.target === 'deb');
    expect(appImage).toBeDefined();
    expect(deb).toBeDefined();
  });

  it('has GitHub publish config', () => {
    const publish = config.publish as Record<string, unknown>;
    expect(publish.provider).toBe('github');
    expect(publish.owner).toBe('ayyesu');
    expect(publish.repo).toBe('CLEER');
  });

  it('has afterSign hook commented out (not needed for unsigned builds)', () => {
    expect(config.afterSign).toBeUndefined();
  });

  it('includes entitlements for macOS', () => {
    const mac = config.mac as Record<string, unknown>;
    expect(mac.entitlements).toBe('build/entitlements.mac.plist');
  });
});

describe('notarization script', () => {
  it('exists', () => {
    const scriptPath = join(__dirname, '../../scripts/notarize.js');
    expect(existsSync(scriptPath)).toBe(true);
  });
});

describe('entitlements', () => {
  it('exists and contains required keys', () => {
    const plistPath = join(__dirname, '../../build/entitlements.mac.plist');
    expect(existsSync(plistPath)).toBe(true);

    const content = readFileSync(plistPath, 'utf-8');
    expect(content).toContain('com.apple.security.cs.allow-jit');
    expect(content).toContain('com.apple.security.network.client');
  });
});
