import { readFileSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';
import type { Platform, RuleDefinition } from '@shared/types';
import { ruleDefinitionSchema } from '@shared/schemas';

export class RulesEngine {
  private rules: RuleDefinition[] = [];

  loadRules(rulesDir: string, platform: Platform): void {
    const platformDir = join(rulesDir, platform);
    if (!existsSync(platformDir)) return;

    const files = readdirSync(platformDir).filter((f) => f.endsWith('.json'));

    for (const file of files) {
      const raw = readFileSync(join(platformDir, file), 'utf-8');
      const parsed = JSON.parse(raw);
      const rule = ruleDefinitionSchema.parse(parsed);
      this.rules.push(rule);
    }
  }

  loadAllPlatforms(rulesDir: string): void {
    const platforms: Platform[] = ['win32', 'darwin', 'linux'];
    for (const platform of platforms) {
      this.loadRules(rulesDir, platform);
    }
  }

  getRulesForPlatform(platform: Platform): RuleDefinition[] {
    return this.rules.filter((r) => r.platforms.includes(platform));
  }

  getRulesForCategory(category: string): RuleDefinition[] {
    return this.rules.filter((r) => r.category === category);
  }

  getAllRules(): RuleDefinition[] {
    return [...this.rules];
  }
}

export function createRulesEngine(): RulesEngine {
  return new RulesEngine();
}
