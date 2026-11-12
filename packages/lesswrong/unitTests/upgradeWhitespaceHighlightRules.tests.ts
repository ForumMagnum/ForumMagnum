import { upgradeWhitespaceHighlightRules } from '@/server/moderatorHighlights/upgradeWhitespaceHighlightRules';
import {
  emptyHighlightRuleOverrides,
  parseHighlightRuleOverrides,
  type HighlightRule,
} from '@/lib/moderatorHighlights/highlightRuleTypes';
import highlightRuleSeed from '@/server/moderatorHighlights/highlightRuleSeed.json';

const seededFormattingRule = parseHighlightRuleOverrides(highlightRuleSeed).rejectionTemplates['Formatting'];

const oldRule: HighlightRule = {
  ...seededFormattingRule,
  groups: seededFormattingRule.groups.filter(group => group.every(condition => condition.signal !== 'focusedBlankLineCount')),
};

const templates = [
  { _id: 'formatting', name: 'Formatting', collectionName: 'Rejections' },
  { _id: 'quality', name: 'Insufficient quality', collectionName: 'Rejections' },
];

describe('upgrading stored formatting highlights', () => {
  test('adds the blank-line group to the formatting rule only', () => {
    const overrides = { ...emptyHighlightRuleOverrides(), rejectionTemplates: { formatting: oldRule, quality: oldRule } };
    const upgraded = upgradeWhitespaceHighlightRules(overrides, templates);
    expect(upgraded.rejectionTemplates.formatting).toEqual(seededFormattingRule);
    expect(upgraded.rejectionTemplates.quality).toEqual(oldRule);
    expect(upgradeWhitespaceHighlightRules(upgraded, templates)).toEqual(upgraded);
    expect(overrides.rejectionTemplates.formatting).toEqual(oldRule);
  });

  test('preserves disabled rules, custom groups and customized cutoffs', () => {
    const customGroup = [{ signal: 'focusedBaseScore', operator: 'lt', value: -10 }] satisfies HighlightRule['groups'][number];
    const overrides = {
      ...emptyHighlightRuleOverrides(),
      rejectionTemplates: { formatting: { enabled: false, groups: [customGroup], level2Groups: [customGroup] } },
    };
    const upgraded = upgradeWhitespaceHighlightRules(overrides, templates);
    expect(upgraded.rejectionTemplates.formatting.enabled).toBe(false);
    expect(upgraded.rejectionTemplates.formatting.groups[0]).toEqual(customGroup);
    expect(upgraded.rejectionTemplates.formatting.level2Groups).toEqual([customGroup]);

    const customized = [{ signal: 'focusedBlankLineCount', operator: 'gte', value: 10 }] satisfies HighlightRule['groups'][number];
    const withCustomCutoff = { ...emptyHighlightRuleOverrides(), rejectionTemplates: { formatting: { enabled: true, groups: [customized] } } };
    expect(upgradeWhitespaceHighlightRules(withCustomCutoff, templates)).toEqual(withCustomCutoff);
  });

  test('leaves overrides without a formatting rule unchanged', () => {
    expect(upgradeWhitespaceHighlightRules(emptyHighlightRuleOverrides(), templates)).toEqual(emptyHighlightRuleOverrides());
  });
});
