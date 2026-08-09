import { describe, it, expect } from 'vitest';
import { existsSync, readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { createRulesEngine } from '../../src/main/services/rulesEngine';
import { ruleDefinitionSchema } from '../../src/shared/schemas';

const RULES_DIR = join(__dirname, '../../rules');

describe('Rules Engine', () => {
  describe('shipped rule files', () => {
    const platforms = ['windows', 'macos', 'linux'] as const;

    for (const platform of platforms) {
      it(`every ${platform}.json rule file passes schema validation`, () => {
        const platformDir = join(RULES_DIR, platform);
        if (!existsSync(platformDir)) return;

        const files = readdirSync(platformDir).filter((f) => f.endsWith('.json'));
        expect(files.length).toBeGreaterThan(0);

        for (const file of files) {
          const raw = readFileSync(join(platformDir, file), 'utf-8');
          const parsed = JSON.parse(raw);
          const result = ruleDefinitionSchema.safeParse(parsed);
          expect(
            result.success,
            `Rule file ${platform}/${file} failed validation: ${result.success ? '' : JSON.stringify((result as { error: unknown }).error)}`,
          ).toBe(true);
        }
      });
    }

    it('every rule specifies riskTier and regenerable', () => {
      const engine = createRulesEngine();
      engine.loadAllPlatforms(RULES_DIR);

      const allRules = engine.getAllRules();
      expect(allRules.length).toBeGreaterThan(0);

      for (const rule of allRules) {
        expect(rule.riskTier).toBeDefined();
        expect(['safe', 'caution', 'dangerous']).toContain(rule.riskTier);
        expect(typeof rule.regenerable).toBe('boolean');
      }
    });
  });

  describe('runtime loading', () => {
    it('getRulesForPlatform returns only rules for that platform', () => {
      const engine = createRulesEngine();
      engine.loadRules(RULES_DIR, 'linux');

      const linuxRules = engine.getRulesForPlatform('linux');
      expect(linuxRules.length).toBeGreaterThan(0);
      expect(linuxRules.every((r) => r.platforms.includes('linux'))).toBe(true);
    });

    it('getRulesForCategory filters correctly', () => {
      const engine = createRulesEngine();
      engine.loadAllPlatforms(RULES_DIR);

      const devCache = engine.getRulesForCategory('dev-cache');
      expect(devCache.every((r) => r.category === 'dev-cache')).toBe(true);
    });

    it('returns empty array for missing platform dir', () => {
      const engine = createRulesEngine();
      engine.loadRules('/nonexistent/path', 'win32');
      expect(engine.getAllRules()).toEqual([]);
    });
  });
});
