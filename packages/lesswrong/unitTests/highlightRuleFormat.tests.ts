import { DEFAULT_ACTION_HIGHLIGHT_RULES } from '@/components/sunshineDashboard/supermod/actionHighlightRules';
import { ALWAYS } from '@/components/sunshineDashboard/supermod/declarativeHighlightRules';
import highlightRuleSeed from '@/server/moderatorHighlights/highlightRuleSeed.json';
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

  // The seed is only read by a migration, so nothing else would reject a bad rule.
  it('accepts every rule in the database seed', () => {
    expect(() => parseHighlightRuleOverrides({ ...highlightRuleSeed, actions: {} })).not.toThrow();
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

describe('seeding the database from template names', () => {
  const templates = [
    { _id: 'templateIdA', name: 'Lotsa DMs', collectionName: 'Messages' },
    { _id: 'templateIdB', name: 'No LLM', collectionName: 'Rejections' },
  ];
  const rule = { enabled: true, groups: [] };

  // This is how the seed migration turns name-keyed rules into id-keyed ones.
  it('re-keys a name-keyed rule onto the template id', () => {
    const migrated = migrateLegacyTemplateRuleOverrideKeys({
      actions: {},
      messageTemplates: { 'Lotsa DMs': rule },
      rejectionTemplates: {},
    }, templates);
    expect(Object.keys(migrated.messageTemplates)).toEqual(['templateIdA']);
  });

  // The migration must not overwrite a rule a moderator has already edited.
  it('keeps an id-keyed rule when a name-keyed one maps to the same template', () => {
    const idKeyed = { enabled: false, groups: [] };
    const migrated = migrateLegacyTemplateRuleOverrideKeys({
      actions: {},
      messageTemplates: { 'Lotsa DMs': rule, templateIdA: idKeyed },
      rejectionTemplates: {},
    }, templates);
    expect(migrated.messageTemplates.templateIdA).toEqual(idKeyed);
  });

  // A name that matches nothing stays put, and the migration drops it.
  it('leaves an unmatched name alone', () => {
    const migrated = migrateLegacyTemplateRuleOverrideKeys({
      actions: {},
      messageTemplates: { 'No Such Template': rule },
      rejectionTemplates: {},
    }, templates);
    expect(Object.keys(migrated.messageTemplates)).toEqual(['No Such Template']);
  });
});
