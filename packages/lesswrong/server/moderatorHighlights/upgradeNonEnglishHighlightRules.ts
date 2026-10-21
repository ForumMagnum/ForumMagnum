import type { HighlightCondition, HighlightRuleOverrides } from '@/lib/moderatorHighlights/highlightRuleTypes';

function upgradeLanguageGroup(group: HighlightCondition[]): HighlightCondition[] {
  // Recognize the shipped heuristic, preserving any moderator-customized cutoffs.
  if (group.length !== 2
    || !group.some(condition => condition.signal === 'focusedLetterCount' && condition.operator === 'gte' && condition.value === 20)
    || !group.some(condition => condition.signal === 'focusedNonLatinLetterRatio' && condition.operator === 'gt' && condition.value === 0.25)
  ) return group;

  return [{ signal: 'focusedNonEnglishProseRatio', operator: 'gt', value: 0.25 }];
}

export function upgradeNonEnglishHighlightRules(overrides: HighlightRuleOverrides): HighlightRuleOverrides {
  return {
    ...overrides,
    rejectionTemplates: Object.fromEntries(Object.entries(overrides.rejectionTemplates).map(([id, rule]) => [id, {
      ...rule,
      groups: rule.groups.map(upgradeLanguageGroup),
    }])),
  };
}
