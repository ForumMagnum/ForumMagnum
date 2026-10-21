import { upgradeOffsiteHighlightRules } from '@/server/moderatorHighlights/upgradeOffsiteHighlightRules';
import { emptyHighlightRuleOverrides, type HighlightRule } from '@/lib/moderatorHighlights/highlightRuleTypes';
import highlightRuleSeed from '@/server/moderatorHighlights/highlightRuleSeed.json';

const oldRule: HighlightRule = {
  enabled: true,
  groups: [
    [
      { signal: 'focusedTextLength', operator: 'lt', value: 600 },
      { signal: 'focusedLinkCount', operator: 'eq', value: 1 },
    ],
    [
      { signal: 'focusedTextLength', operator: 'lt', value: 600 },
      { signal: 'focusedHasLinkpostUrl', operator: 'isTrue', value: null },
    ],
  ],
};

const templates = [
  { _id: 'offsite', name: 'Difficult to evaluate (offsite content)', collectionName: 'Rejections' },
  { _id: 'spam', name: 'Not obviously not spam', collectionName: 'Rejections' },
];

describe('upgrading stored offsite highlights', () => {
  test('upgrades offsite rules without changing the identical spam heuristic', () => {
    const overrides = { ...emptyHighlightRuleOverrides(), rejectionTemplates: { offsite: oldRule, spam: oldRule } };
    const upgraded = upgradeOffsiteHighlightRules(overrides, templates);
    expect(upgraded.rejectionTemplates.offsite).toEqual(highlightRuleSeed.rejectionTemplates['Difficult to evaluate (offsite content)']);
    expect(upgraded.rejectionTemplates.spam).toEqual(oldRule);
    expect(upgradeOffsiteHighlightRules(upgraded, templates)).toEqual(upgraded);
    expect(overrides.rejectionTemplates.offsite).toEqual(oldRule);
  });

  test('preserves disabled rules and custom alternatives', () => {
    const customGroup = [{ signal: 'focusedBaseScore', operator: 'lt', value: -10 }] satisfies HighlightRule['groups'][number];
    const overrides = {
      ...emptyHighlightRuleOverrides(),
      rejectionTemplates: { offsite: { ...oldRule, enabled: false, groups: [...oldRule.groups, customGroup], level2Groups: [customGroup] } },
    };
    const upgraded = upgradeOffsiteHighlightRules(overrides, templates);
    expect(upgraded.rejectionTemplates.offsite.enabled).toBe(false);
    expect(upgraded.rejectionTemplates.offsite.groups[2]).toEqual(customGroup);
    expect(upgraded.rejectionTemplates.offsite.level2Groups).toEqual([customGroup]);
  });

  test('leaves customized thresholds and removed rules unchanged', () => {
    const customRule: HighlightRule = {
      ...oldRule,
      groups: [[{ signal: 'focusedTextLength', operator: 'lt', value: 100 }, oldRule.groups[0][1]]],
    };
    const overrides = { ...emptyHighlightRuleOverrides(), rejectionTemplates: { offsite: customRule } };
    expect(upgradeOffsiteHighlightRules(overrides, templates)).toEqual(overrides);
    expect(upgradeOffsiteHighlightRules(emptyHighlightRuleOverrides(), templates)).toEqual(emptyHighlightRuleOverrides());
  });
});
