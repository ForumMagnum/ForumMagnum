import {
  DEFAULT_ACTION_HIGHLIGHT_RULES,
} from '@/components/sunshineDashboard/supermod/actionHighlightRules';
import { ALWAYS } from '@/components/sunshineDashboard/supermod/declarativeHighlightRules';
import {
  DEFAULT_MESSAGE_TEMPLATE_RULES,
  DEFAULT_REJECTION_TEMPLATE_RULES,
  MESSAGE_TEMPLATE_IDS,
  REJECTION_TEMPLATE_IDS,
} from '@/components/sunshineDashboard/supermod/templateHighlightRules';
import {
  isCaseSensitiveRegexHighlightOperator,
  isDistinctRegexHighlightOperator,
  isItemCountRegexHighlightOperator,
  migrateLegacyTemplateRuleOverrideKeys,
  parseHighlightRuleOverrides,
  regexHighlightOperators,
  serializeHighlightRuleOverrides,
  type HighlightRuleOverrides,
} from '@/lib/moderatorHighlights/highlightRuleTypes';

const defaultsAsOverrides: HighlightRuleOverrides = {
  actions: DEFAULT_ACTION_HIGHLIGHT_RULES,
  messageTemplates: DEFAULT_MESSAGE_TEMPLATE_RULES,
  rejectionTemplates: DEFAULT_REJECTION_TEMPLATE_RULES,
};

describe('highlight rule serialization format', () => {
  // Defaults never pass through the validator, so bad ones fail silently.
  it('accepts every rule shipped as a default', () => {
    expect(() => parseHighlightRuleOverrides(serializeHighlightRuleOverrides(defaultsAsOverrides))).not.toThrow();
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

describe('template id maps', () => {
  // A duplicate computed key isn't a TS error; the second rule just wins.
  it('has no duplicate ids', () => {
    for (const ids of [MESSAGE_TEMPLATE_IDS, REJECTION_TEMPLATE_IDS]) {
      const values = Object.values(ids);
      expect(new Set(values).size).toBe(values.length);
    }
  });

  it('defines a default rule per distinct template id', () => {
    expect(Object.keys(DEFAULT_MESSAGE_TEMPLATE_RULES).length)
      .toBe(new Set(Object.keys(DEFAULT_MESSAGE_TEMPLATE_RULES)).size);
    expect(Object.keys(DEFAULT_REJECTION_TEMPLATE_RULES).length)
      .toBe(new Set(Object.keys(DEFAULT_REJECTION_TEMPLATE_RULES)).size);
  });
});

describe('legacy override key migration', () => {
  const templates = [
    { _id: 'templateIdA', name: 'Lotsa DMs', collectionName: 'Messages' },
    { _id: 'templateIdB', name: 'No LLM', collectionName: 'Rejections' },
  ];
  const rule = { enabled: true, groups: [] };

  it('re-keys a name-keyed override onto the template id', () => {
    const migrated = migrateLegacyTemplateRuleOverrideKeys({
      actions: {},
      messageTemplates: { 'Lotsa DMs': rule },
      rejectionTemplates: {},
    }, templates);
    expect(Object.keys(migrated.messageTemplates)).toEqual(['templateIdA']);
  });

  it('keeps an id-keyed override when a name-keyed one maps to the same template', () => {
    const idKeyed = { enabled: false, groups: [] };
    const migrated = migrateLegacyTemplateRuleOverrideKeys({
      actions: {},
      messageTemplates: { 'Lotsa DMs': rule, templateIdA: idKeyed },
      rejectionTemplates: {},
    }, templates);
    expect(migrated.messageTemplates.templateIdA).toEqual(idKeyed);
  });
});
