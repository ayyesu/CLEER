import { describe, it, expect } from 'vitest';
import { createRiskTierEngine } from '../../src/main/services/riskTierEngine';
import type { RuleDefinition, ScanEntry } from '@shared/types';

const rules: RuleDefinition[] = [
  {
    id: 'npm-cache',
    category: 'dev-cache',
    platforms: ['darwin', 'linux', 'win32'],
    paths: ['/.npm/', '/npm-cache/'],
    riskTier: 'safe',
    regenerable: true,
    description: 'npm cache',
  },
];

const engine = createRiskTierEngine(rules);

describe('RiskTierEngine', () => {
  it('classifies matching entry as safe', () => {
    const entry: ScanEntry = {
      path: '/home/user/.npm/_cacache/file',
      sizeBytes: 1024,
      kind: 'file',
      category: 'dev-cache',
    };
    const classified = engine.classify(entry);
    expect(classified.riskTier).toBe('safe');
    expect(classified.regenerable).toBe(true);
  });

  it('classifies unmatched entry as caution', () => {
    const entry: ScanEntry = {
      path: '/home/user/random/file.txt',
      sizeBytes: 512,
      kind: 'file',
      category: 'dev-cache',
    };
    const classified = engine.classify(entry);
    expect(classified.riskTier).toBe('caution');
    expect(classified.regenerable).toBe(false);
  });
});
