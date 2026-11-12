import type { HighlightCondition, HighlightRule, HighlightRuleOverrides } from '@/lib/moderatorHighlights/highlightRuleTypes';

function upgradeLanguageGroup(group: HighlightCondition[]): HighlightCondition[] {
  // Recognize the shipped heuristic, preserving any moderator-customized cutoffs.
  if (group.length !== 2
    || !group.some(condition => condition.signal === 'focusedLetterCount' && condition.operator === 'gte' && condition.value === 20)
    || !group.some(condition => condition.signal === 'focusedNonLatinLetterRatio' && condition.operator === 'gt' && condition.value === 0.25)
  ) return group;

  return [{ signal: 'focusedNonEnglishProseRatio', operator: 'gt', value: 0.25 }];
}

function isDefaultLanguageRatioGroup(group: HighlightCondition[]): boolean {
  return group.length === 1
    && group[0].signal === 'focusedNonEnglishProseRatio'
    && group[0].operator === 'gt'
    && group[0].value === 0.25;
}

function hasLanguageCountCondition(group: HighlightCondition[]): boolean {
  return group.some(condition => condition.signal === 'focusedNonEnglishProseLetterCount');
}

function upgradeLanguageRule(rule: HighlightRule): HighlightRule {
  const groups = rule.groups.map(upgradeLanguageGroup);
  // A translation can dilute the ratio even when there are pages of non-English
  // prose. Extend the shipped rule, preserving customized ratios/count cutoffs.
  if (groups.some(isDefaultLanguageRatioGroup) && !groups.some(hasLanguageCountCondition)) {
    groups.push([{ signal: 'focusedNonEnglishProseLetterCount', operator: 'gte', value: 300 }]);
  }
  return { ...rule, groups };
}

export function upgradeNonEnglishHighlightRules(overrides: HighlightRuleOverrides): HighlightRuleOverrides {
  return {
    ...overrides,
    rejectionTemplates: Object.fromEntries(Object.entries(overrides.rejectionTemplates).map(([id, rule]) => [id, upgradeLanguageRule(rule)])),
  };
}
