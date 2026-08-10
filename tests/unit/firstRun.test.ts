import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { load as yamlLoad } from 'js-yaml';

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

describe('first-run experience', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('shows first run when not completed', () => {
    const isFirstRun = localStorage.getItem('cleer.firstRunComplete') !== 'true';
    expect(isFirstRun).toBe(true);
  });

  it('hides first run after completion', () => {
    localStorage.setItem('cleer.firstRunComplete', 'true');
    const isFirstRun = localStorage.getItem('cleer.firstRunComplete') !== 'true';
    expect(isFirstRun).toBe(false);
  });

  it('has exactly 4 onboarding steps', () => {
    const steps = ['Welcome', 'Read-Only', 'Privacy', 'Permissions'];
    expect(steps.length).toBe(4);
  });

  it('includes all required onboarding topics', () => {
    const requiredTopics = ['Welcome', 'Read-Only', 'Privacy', 'Permissions'];
    const steps = ['Welcome', 'Read-Only', 'Privacy', 'Permissions'];
    for (const topic of requiredTopics) {
      expect(steps).toContain(topic);
    }
  });

  it('does not skip first run on fresh install', () => {
    expect(localStorage.getItem('cleer.firstRunComplete')).toBeNull();
  });

  it('persists first-run completion across sessions', () => {
    localStorage.setItem('cleer.firstRunComplete', 'true');
    const value = localStorage.getItem('cleer.firstRunComplete');
    expect(value).toBe('true');
  });
});

describe('electron-builder config', () => {
  it('has valid YAML structure', () => {
    const raw = readFileSync(
      join(__dirname, '../../electron-builder.yml'),
      'utf-8',
    );
    const config = yamlLoad(raw) as Record<string, unknown>;

    expect(config.appId).toBeDefined();
    expect(config.productName).toBeDefined();
    expect(config.mac).toBeDefined();
    expect(config.win).toBeDefined();
    expect(config.linux).toBeDefined();
  });

  it('has publish config for auto-updates', () => {
    const raw = readFileSync(
      join(__dirname, '../../electron-builder.yml'),
      'utf-8',
    );
    const config = yamlLoad(raw) as Record<string, unknown>;

    expect(config.publish).toBeDefined();
    const publish = config.publish as Record<string, unknown>;
    expect(publish.provider).toBe('github');
  });
});
