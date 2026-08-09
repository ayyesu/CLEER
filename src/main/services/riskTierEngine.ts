import type {
  ClassifiedScanEntry,
  RiskTier,
  RuleDefinition,
  ScanEntry,
} from '@shared/types';

export class RiskTierEngine {
  constructor(private rules: RuleDefinition[]) {}

  classify(entry: ScanEntry): ClassifiedScanEntry {
    const matchingRule = this.rules.find((rule) => this.matchesRule(entry, rule));

    const riskTier: RiskTier = matchingRule?.riskTier ?? 'caution';
    const regenerable = matchingRule?.regenerable ?? false;

    return {
      ...entry,
      riskTier,
      regenerable,
    };
  }

  private matchesRule(entry: ScanEntry, rule: RuleDefinition): boolean {
    if (rule.category !== entry.category) return false;
    return rule.paths.some((rulePath) => entry.path.includes(rulePath));
  }
}

export function createRiskTierEngine(rules: RuleDefinition[]): RiskTierEngine {
  return new RiskTierEngine(rules);
}
