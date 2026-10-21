import { DEFAULT_ACTION_HIGHLIGHT_RULES } from '@/components/sunshineDashboard/supermod/actionHighlightRules';
import {
  getFormattingParagraphPlaintextsFromHtml,
  getLongestFormattingSentenceLengthFromHtml,
  getRepeatedPunctuationRunCountFromHtml,
  stripHtml,
} from '@/components/sunshineDashboard/supermod/contentTextHelpers';
import { HIGHLIGHT_SIGNALS } from '@/components/sunshineDashboard/supermod/highlightSignals';
import highlightRuleSeed from '@/server/moderatorHighlights/highlightRuleSeed.json';
import {
  isCaseSensitiveRegexHighlightOperator,
  isItemCountRegexHighlightOperator,
  isNumericHighlightOperator,
  isRegexHighlightOperator,
  parseHighlightRuleOverrides,
  type HighlightCondition,
  type HighlightRule,
} from '@/lib/moderatorHighlights/highlightRuleTypes';

const seed = parseHighlightRuleOverrides({ ...highlightRuleSeed, actions: {} });

function allConditions(rules: Record<string, HighlightRule>): HighlightCondition[] {
  return Object.values(rules).flatMap(rule => [...rule.groups, ...(rule.level2Groups ?? [])].flat());
}

function conditionRegex(condition: HighlightCondition): RegExp {
  if (typeof condition.value !== 'string') throw new Error(`Expected a regex condition on ${condition.signal}`);
  return new RegExp(condition.value, isCaseSensitiveRegexHighlightOperator(condition.operator) ? '' : 'i');
}

function seededRule(category: 'messageTemplates' | 'rejectionTemplates', name: string): HighlightRule {
  const rule = seed[category][name];
  if (!rule) throw new Error(`No seeded rule named ${name}`);
  return rule;
}

describe('shipped rules against the signal registry', () => {
  const allRuleSets = [DEFAULT_ACTION_HIGHLIGHT_RULES, seed.messageTemplates, seed.rejectionTemplates];

  // A type mismatch compiles fine; the rule just never fires again.
  it('pairs every condition with an operator its signal type supports', () => {
    const mismatches: string[] = [];
    for (const rules of allRuleSets) {
      for (const condition of allConditions(rules)) {
        const signal = HIGHLIGHT_SIGNALS[condition.signal];
        if (!signal) {
          mismatches.push(`${condition.signal} is not a registered signal`);
          continue;
        }
        const expectsRegex = signal.type === 'string' || signal.type === 'stringList';
        const expectsNumeric = signal.type === 'number';
        const ok = expectsRegex
          ? isRegexHighlightOperator(condition.operator)
          : expectsNumeric
            ? isNumericHighlightOperator(condition.operator)
            : !isRegexHighlightOperator(condition.operator) && !isNumericHighlightOperator(condition.operator);
        if (!ok) mismatches.push(`${condition.signal} (${signal.type}) with operator ${condition.operator}`);
      }
    }
    expect(mismatches).toEqual([]);
  });

  // With focusedContent null, `isFalse` on a focused signal matches everyone.
  it('only uses user-scoped signals where there is no selected content', () => {
    const outOfScope: string[] = [];
    for (const rules of [DEFAULT_ACTION_HIGHLIGHT_RULES, seed.messageTemplates]) {
      for (const condition of allConditions(rules)) {
        if (HIGHLIGHT_SIGNALS[condition.signal]?.scope !== 'user') outOfScope.push(condition.signal);
      }
    }
    expect(outOfScope).toEqual([]);
  });

  // On a plain string signal the list has one element, so 2+ can't match.
  it('only counts matching items on list-valued signals', () => {
    const misdirected: string[] = [];
    for (const rules of allRuleSets) {
      for (const condition of allConditions(rules)) {
        if (!isItemCountRegexHighlightOperator(condition.operator)) continue;
        if (HIGHLIGHT_SIGNALS[condition.signal]?.type !== 'stringList') misdirected.push(condition.signal);
      }
    }
    expect(misdirected).toEqual([]);
  });
});

describe('case-sensitive formatting patterns', () => {
  const formattingRule = seededRule('messageTemplates', 'Formatting / Grammar');
  const lowercaseStarts = conditionRegex(formattingRule.groups[0][0]);
  const missingSpaces = conditionRegex(formattingRule.groups[1][0]);

  // Under /i these degenerate into "has four sentences" and fire on anything.
  it('does not fire on well-capitalized prose', () => {
    const wellFormed = 'This is one sentence. Here is another one. And a third here. Finally a fourth one. Then a fifth one.';
    expect(lowercaseStarts.test(wellFormed)).toBe(false);
    expect(missingSpaces.test(wellFormed)).toBe(false);
  });

  it('fires on repeatedly lowercase sentence starts', () => {
    expect(lowercaseStarts.test('This is a sentence. this one is lowercase. Another one here. and this one too. One more here.')).toBe(true);
  });

  it('fires on repeatedly missing spaces after a period', () => {
    expect(missingSpaces.test('The first thing.Then the second thing happened.Third thing now.')).toBe(true);
  });
});

describe('the composed AI research pattern', () => {
  const messageRule = seededRule('messageTemplates', 'No Unmotivated Vibecoded AI Research');
  const itemCountCondition = allConditions({ messageRule })
    .find(condition => isItemCountRegexHighlightOperator(condition.operator));
  if (!itemCountCondition) throw new Error('No item-count condition in the AI research rule');
  const composed = conditionRegex(itemCountCondition);

  // Flattening either half's grouping breaks this order, not the obvious one.
  it('matches regardless of which half appears first', () => {
    expect(composed.test('the AGI training run')).toBe(true);
    expect(composed.test('training run for AGI')).toBe(true);
  });

  it('needs both halves', () => {
    expect(composed.test('a training run with careful methodology')).toBe(false);
    expect(composed.test('some thoughts about AGI')).toBe(false);
  });
});

describe('content text helpers', () => {
  // Every length threshold in the rules is measured in these units.
  it('separates elements rather than concatenating across tags', () => {
    expect(stripHtml('<b>hel</b>lo').replace(/\s+/g, ' ').trim()).toBe('hel lo');
  });

  it('splits paragraph-wrapped content per paragraph', () => {
    expect(getFormattingParagraphPlaintextsFromHtml('<p>One.</p><p>Two.</p>')).toEqual(['One.', 'Two.']);
  });

  it('treats fully unwrapped content as a single paragraph', () => {
    expect(getFormattingParagraphPlaintextsFromHtml('just some text')).toEqual(['just some text']);
  });

  // Rules keyed on a paragraph count of 1 never fire here; pinned on purpose.
  it('reports no paragraphs for content broken up only by other block markup', () => {
    expect(getFormattingParagraphPlaintextsFromHtml('one<br>two')).toEqual([]);
    expect(getFormattingParagraphPlaintextsFromHtml('<li>one</li><li>two</li>')).toEqual([]);
  });

  it('counts runs of at least three sentence punctuation characters', () => {
    expect(getRepeatedPunctuationRunCountFromHtml('<p>Wait... really!!! Sure.</p>')).toBe(2);
  });

  it('measures the longest sentence within a paragraph', () => {
    expect(getLongestFormattingSentenceLengthFromHtml('<p>Short. A somewhat longer sentence here.</p>')).toBe(31);
  });
});
