import { DEFAULT_ACTION_HIGHLIGHT_RULES } from '@/components/sunshineDashboard/supermod/actionHighlightRules';
import { ALWAYS } from '@/components/sunshineDashboard/supermod/declarativeHighlightRules';
import highlightRulesJson from '@/lib/moderatorHighlights/highlightRules.json';
import {
  isCaseSensitiveRegexHighlightOperator,
  isDistinctRegexHighlightOperator,
  isItemCountRegexHighlightOperator,
  parseHighlightRuleOverrides,
  regexHighlightOperators,
  serializeHighlightRuleOverrides,
  type HighlightRuleOverrides,
} from '@/lib/moderatorHighlights/highlightRuleTypes';

describe('highlight rule serialization format', () => {
  // Action defaults never pass through the validator, so bad ones fail silently.
  it('accepts every rule shipped as an action default', () => {
    const overrides = {
      actions: DEFAULT_ACTION_HIGHLIGHT_RULES,
      messageTemplates: {},
      rejectionTemplates: {},
    };
    expect(() => parseHighlightRuleOverrides(serializeHighlightRuleOverrides(overrides))).not.toThrow();
  });

  // The rules file is parsed at import time, so a bad rule would break the moderation inbox.
  it('accepts every rule in the rules file', () => {
    expect(() => parseHighlightRuleOverrides(highlightRulesJson)).not.toThrow();
  });

  // Both list fields explicitly, so a new one is dropped unless both change.
  it('round-trips every field of the format without dropping any', () => {
    const overrides: HighlightRuleOverrides = {
      actions: {
        approve: {
          enabled: false,
          groups: [[{ signal: 'userKarma', operator: 'gte', value: 10, explanation: 'has karma' }]],
          level2Groups: [[{ signal: 'conversationsDisabled', operator: 'isFalse', value: null }]],
        },
      },
      messageTemplates: {
        someTemplateId: {
          enabled: true,
          groups: [[{
            signal: 'contentTitlesAndTexts',
            operator: 'matchesRegexInAtLeastItems',
            value: 'spam',
            minimumMatches: 3,
            explanation: 'three spammy items',
          }]],
        },
      },
      rejectionTemplates: {},
    };
    expect(parseHighlightRuleOverrides(serializeHighlightRuleOverrides(overrides))).toEqual(overrides);
  });

  // Dropping empty groups would demote disableMessages from level 2 to 1.
  it('preserves an always-matching empty group', () => {
    const overrides: HighlightRuleOverrides = {
      actions: { disableMessages: { enabled: true, groups: [[]], level2Groups: ALWAYS } },
      messageTemplates: {},
      rejectionTemplates: {},
    };
    expect(parseHighlightRuleOverrides(serializeHighlightRuleOverrides(overrides))).toEqual(overrides);
  });
});

describe('regex operator classification', () => {
  // An unclassified operator falls through to case-insensitive .test().
  const expectedClassification: Record<string, { caseSensitive: boolean, distinct: boolean, itemCount: boolean }> = {
    matchesRegex: { caseSensitive: false, distinct: false, itemCount: false },
    matchesRegexCaseSensitive: { caseSensitive: true, distinct: false, itemCount: false },
    hasAtLeastDistinctRegexMatches: { caseSensitive: false, distinct: true, itemCount: false },
    hasAtLeastDistinctRegexMatchesCaseSensitive: { caseSensitive: true, distinct: true, itemCount: false },
    matchesRegexInAtLeastItems: { caseSensitive: false, distinct: false, itemCount: true },
    matchesRegexInAtLeastItemsCaseSensitive: { caseSensitive: true, distinct: false, itemCount: true },
  };

  it('classifies every regex operator explicitly', () => {
    for (const operator of regexHighlightOperators) {
      const expected = expectedClassification[operator];
      expect(expected).toBeDefined();
      expect({
        caseSensitive: isCaseSensitiveRegexHighlightOperator(operator),
        distinct: isDistinctRegexHighlightOperator(operator),
        itemCount: isItemCountRegexHighlightOperator(operator),
      }).toEqual(expected);
    }
  });
});
