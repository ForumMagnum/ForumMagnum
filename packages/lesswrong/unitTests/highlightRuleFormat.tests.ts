import { DEFAULT_ACTION_HIGHLIGHT_RULES } from '@/components/sunshineDashboard/supermod/actionHighlightRules';
import { HIGHLIGHT_SIGNALS } from '@/components/sunshineDashboard/supermod/highlightSignals';
import { highlightRuleOverrides } from '@/lib/moderatorHighlights/highlightRules';
import {
  formatHighlightRuleOverrides,
  isNumericHighlightOperator,
  isRegexHighlightOperator,
  parseHighlightRuleOverrides,
  type HighlightRuleOverrides,
} from '@/lib/moderatorHighlights/highlightRuleTypes';

// Rules reference signals by name from JSON, so a renamed or retyped signal compiles but never fires.
it('pairs every shipped condition with a registered signal and a compatible operator', () => {
  const ruleSets = [DEFAULT_ACTION_HIGHLIGHT_RULES, ...Object.values(highlightRuleOverrides)];
  const mismatches = ruleSets.flatMap(rules => Object.values(rules))
    .flatMap(rule => [...rule.groups, ...(rule.level2Groups ?? [])].flat())
    .filter(condition => {
      const type = HIGHLIGHT_SIGNALS[condition.signal]?.type;
      if (!type) return true;
      if (type === 'number') return !isNumericHighlightOperator(condition.operator);
      if (type === 'boolean') return isNumericHighlightOperator(condition.operator) || isRegexHighlightOperator(condition.operator);
      return !isRegexHighlightOperator(condition.operator);
    })
    .map(condition => `${condition.signal} ${condition.operator}`);
  expect(mismatches).toEqual([]);
});

// parseCondition copies fields explicitly, so a new field is dropped on save unless it's added there
it('round-trips every field of the format', () => {
  const overrides: HighlightRuleOverrides = {
    actions: {
      approve: {
        enabled: false,
        groups: [[{ signal: 'userKarma', operator: 'gte', value: 10, explanation: 'has karma' }]],
        level2Groups: [[{ signal: 'conversationsDisabled', operator: 'isFalse', value: null }]],
      },
    },
    messageTemplates: {
      someTemplate: {
        enabled: true,
        groups: [[{ signal: 'contentTitlesAndTexts', operator: 'matchesRegexInAtLeastItems', value: 'spam', minimumMatches: 3 }]],
      },
    },
    rejectionTemplates: {},
  };
  expect(parseHighlightRuleOverrides(JSON.parse(formatHighlightRuleOverrides(overrides)))).toEqual(overrides);
});
