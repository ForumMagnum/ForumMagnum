import { upgradeNonEnglishHighlightRules } from '@/server/moderatorHighlights/upgradeNonEnglishHighlightRules';
import { emptyHighlightRuleOverrides, type HighlightRule } from '@/lib/moderatorHighlights/highlightRuleTypes';
import highlightRuleSeed from '@/server/moderatorHighlights/highlightRuleSeed.json';

const oldRule: HighlightRule = {
  enabled: true,
  groups: [[
    { signal: 'focusedLetterCount', operator: 'gte', value: 20 },
    { signal: 'focusedNonLatinLetterRatio', operator: 'gt', value: 0.25 },
  ]],
};

const ratioRule: HighlightRule = {
  enabled: true,
  groups: [[{ signal: 'focusedNonEnglishProseRatio', operator: 'gt', value: 0.25 }]],
};

describe('upgrading stored English-language highlights', () => {
  test.each([oldRule, ratioRule])('upgrades earlier rules to the same rule seeded for new databases: %j', rule => {
    const overrides = { ...emptyHighlightRuleOverrides(), rejectionTemplates: { templateId: rule } };
    const upgraded = upgradeNonEnglishHighlightRules(overrides);
    expect(upgraded.rejectionTemplates.templateId).toEqual(highlightRuleSeed.rejectionTemplates['We only accept English-language content']);
    expect(upgradeNonEnglishHighlightRules(upgraded)).toEqual(upgraded);
    expect(overrides.rejectionTemplates.templateId).toEqual(rule);
  });

  test('preserves disabled rules, additional alternatives, and unrelated categories', () => {
    const otherGroup = [{ signal: 'focusedBaseScore', operator: 'lt', value: -10 }] satisfies HighlightRule['groups'][number];
    const overrides = {
      actions: { action: oldRule },
      messageTemplates: { message: oldRule },
      rejectionTemplates: { template: { ...oldRule, enabled: false, groups: [...oldRule.groups, otherGroup], level2Groups: [otherGroup] } },
    };
    const upgraded = upgradeNonEnglishHighlightRules(overrides);
    expect(upgraded.actions).toEqual(overrides.actions);
    expect(upgraded.messageTemplates).toEqual(overrides.messageTemplates);
    expect(upgraded.rejectionTemplates.template.enabled).toBe(false);
    expect(upgraded.rejectionTemplates.template.groups[1]).toEqual(otherGroup);
    expect(upgraded.rejectionTemplates.template.groups[2]).toEqual([
      { signal: 'focusedNonEnglishProseLetterCount', operator: 'gte', value: 300 },
    ]);
    expect(upgraded.rejectionTemplates.template.level2Groups).toEqual([otherGroup]);
  });

  test('leaves customized thresholds unchanged', () => {
    const customRule: HighlightRule = {
      ...oldRule,
      groups: [[oldRule.groups[0][0], { signal: 'focusedNonLatinLetterRatio', operator: 'gt', value: 0.5 }]],
    };
    const overrides = { ...emptyHighlightRuleOverrides(), rejectionTemplates: { template: customRule } };
    expect(upgradeNonEnglishHighlightRules(overrides)).toEqual(overrides);
  });

  test('leaves customized language ratios and absolute counts unchanged', () => {
    const customRatio: HighlightRule = {
      enabled: true,
      groups: [[{ signal: 'focusedNonEnglishProseRatio', operator: 'gt', value: 0.5 }]],
    };
    const customCount: HighlightRule = {
      ...ratioRule,
      groups: [...ratioRule.groups, [{ signal: 'focusedNonEnglishProseLetterCount', operator: 'gte', value: 600 }]],
    };
    const overrides = { ...emptyHighlightRuleOverrides(), rejectionTemplates: { customRatio, customCount } };
    expect(upgradeNonEnglishHighlightRules(overrides)).toEqual(overrides);
  });
});
