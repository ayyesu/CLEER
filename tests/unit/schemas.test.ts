import { describe, it, expect } from 'vitest';
import { scanOptionsSchema, ruleDefinitionSchema } from '../../src/shared/schemas';

describe('schemas', () => {
  describe('scanOptionsSchema', () => {
    it('accepts valid options', () => {
      const result = scanOptionsSchema.safeParse({
        categories: ['temp', 'cache'],
        targetPaths: ['/tmp'],
        minSizeBytes: 1024,
      });
      expect(result.success).toBe(true);
    });

    it('rejects empty categories', () => {
      const result = scanOptionsSchema.safeParse({
        categories: [],
        targetPaths: ['/tmp'],
      });
      expect(result.success).toBe(false);
    });
  });

  describe('ruleDefinitionSchema', () => {
    it('accepts valid rule', () => {
      const result = ruleDefinitionSchema.safeParse({
        id: 'test-rule',
        category: 'temp',
        platforms: ['darwin'],
        paths: ['/tmp/'],
        riskTier: 'safe',
        regenerable: true,
        description: 'Test rule',
      });
      expect(result.success).toBe(true);
    });

    it('rejects missing riskTier', () => {
      const result = ruleDefinitionSchema.safeParse({
        id: 'test-rule',
        category: 'temp',
        platforms: ['darwin'],
        paths: ['/tmp/'],
        regenerable: true,
        description: 'Test rule',
      });
      expect(result.success).toBe(false);
    });
  });
});
