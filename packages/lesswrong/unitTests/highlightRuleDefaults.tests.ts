import { DEFAULT_ACTION_HIGHLIGHT_RULES } from '@/components/sunshineDashboard/supermod/actionHighlightRules';
import {
  getFormattingParagraphPlaintextsFromHtml,
  getLongestFormattingSentenceLengthFromHtml,
  getRepeatedPunctuationRunCountFromHtml,
  stripHtml,
} from '@/components/sunshineDashboard/supermod/contentTextHelpers';
import { HIGHLIGHT_SIGNALS } from '@/components/sunshineDashboard/supermod/highlightSignals';
import {
  DEFAULT_MESSAGE_TEMPLATE_RULES,
  DEFAULT_REJECTION_TEMPLATE_RULES,
  MESSAGE_TEMPLATE_IDS,
  REJECTION_TEMPLATE_IDS,
} from '@/components/sunshineDashboard/supermod/templateHighlightRules';
import {
  isCaseSensitiveRegexHighlightOperator,
  isItemCountRegexHighlightOperator,
  isNumericHighlightOperator,
  isRegexHighlightOperator,
  type HighlightCondition,
  type HighlightRule,
} from '@/lib/moderatorHighlights/highlightRuleTypes';

function allConditions(rules: Record<string, HighlightRule>): HighlightCondition[] {
  return Object.values(rules).flatMap(rule => [...rule.groups, ...(rule.level2Groups ?? [])].flat());
}

function conditionRegex(condition: HighlightCondition): RegExp {
  if (typeof condition.value !== 'string') throw new Error(`Expected a regex condition on ${condition.signal}`);
  return new RegExp(condition.value, isCaseSensitiveRegexHighlightOperator(condition.operator) ? '' : 'i');
}

function findCondition(rule: HighlightRule, signal: string, predicate: (c: HighlightCondition) => boolean) {
  const condition = allConditions({ rule }).find(c => c.signal === signal && predicate(c));
  if (!condition) throw new Error(`No matching condition on ${signal}`);
  return condition;
}

describe('default rules against the signal registry', () => {
  // The condition builders take any signal name, with no link to that signal's declared type.
  // A mismatch doesn't fail to compile — the evaluator's guard clauses just return false and
  // the rule silently never fires again.
  it('pairs every condition with an operator its signal type supports', () => {
    const mismatches: string[] = [];
    for (const rules of [DEFAULT_ACTION_HIGHLIGHT_RULES, DEFAULT_MESSAGE_TEMPLATE_RULES, DEFAULT_REJECTION_TEMPLATE_RULES]) {
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

  // Action and message-template rules are evaluated with focusedContent: null. Focused numeric
  // and string signals then fail closed, but focused *boolean* signals return false — so an
  // `isFalse` condition on one would be satisfied for every user in the queue.
  it('only uses user-scoped signals where there is no selected content', () => {
    const outOfScope: string[] = [];
    for (const rules of [DEFAULT_ACTION_HIGHLIGHT_RULES, DEFAULT_MESSAGE_TEMPLATE_RULES]) {
      for (const condition of allConditions(rules)) {
        if (HIGHLIGHT_SIGNALS[condition.signal]?.scope !== 'user') outOfScope.push(condition.signal);
      }
    }
    expect(outOfScope).toEqual([]);
  });

  // An item-count operator counts how many strings in a list signal match. Pointed at a plain
  // string signal the list has one element, so any minimumMatches above 1 is unsatisfiable.
  it('only counts matching items on list-valued signals', () => {
    const misdirected: string[] = [];
    for (const rules of [DEFAULT_ACTION_HIGHLIGHT_RULES, DEFAULT_MESSAGE_TEMPLATE_RULES, DEFAULT_REJECTION_TEMPLATE_RULES]) {
      for (const condition of allConditions(rules)) {
        if (!isItemCountRegexHighlightOperator(condition.operator)) continue;
        if (HIGHLIGHT_SIGNALS[condition.signal]?.type !== 'stringList') misdirected.push(condition.signal);
      }
    }
    expect(misdirected).toEqual([]);
  });
});

describe('case-sensitive formatting patterns', () => {
  const formattingRule = DEFAULT_MESSAGE_TEMPLATE_RULES[MESSAGE_TEMPLATE_IDS.formattingGrammar];
  const lowercaseStarts = conditionRegex(formattingRule.groups[0][0]);
  const missingSpaces = conditionRegex(formattingRule.groups[1][0]);

  // These patterns detect problems by case. If anyone drops the explicit case-sensitive operator
  // (matchesRegex, the builder's default, is case-*insensitive*), [a-z] starts matching uppercase
  // and "two sentences starting lowercase" degenerates into "has four sentences".
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
  const rule = DEFAULT_REJECTION_TEMPLATE_RULES[REJECTION_TEMPLATE_IDS.noUnmotivatedVibecodedAiResearch];
  const messageRule = DEFAULT_MESSAGE_TEMPLATE_RULES[MESSAGE_TEMPLATE_IDS.noUnmotivatedVibecodedAiResearch];
  const composed = conditionRegex(findCondition(messageRule, 'postTitlesAndTexts', c => isItemCountRegexHighlightOperator(c.operator)));

  // The topic and process patterns are interpolated into two lookaheads, so flattening either
  // one's grouping changes precedence inside the lookahead. Order-independence is the property
  // that breaks first, and only for some orderings — a canonical example still passes.
  it('matches regardless of which half appears first', () => {
    expect(composed.test('the AGI training run')).toBe(true);
    expect(composed.test('training run for AGI')).toBe(true);
  });

  it('needs both halves', () => {
    expect(composed.test('a training run with careful methodology')).toBe(false);
    expect(composed.test('some thoughts about AGI')).toBe(false);
  });

  it('is also used for the rejection template', () => {
    expect(rule.groups[0].some(condition => condition.signal === 'focusedTitleAndText')).toBe(true);
  });
});

describe('content text helpers', () => {
  // Every length threshold in templateHighlightRules is measured in these units, including the
  // ones the comments describe as backtested, so a change here silently retunes all of them.
  it('separates elements rather than concatenating across tags', () => {
    expect(stripHtml('<b>hel</b>lo').replace(/\s+/g, ' ').trim()).toBe('hel lo');
  });

  it('splits paragraph-wrapped content per paragraph', () => {
    expect(getFormattingParagraphPlaintextsFromHtml('<p>One.</p><p>Two.</p>')).toEqual(['One.', 'Two.']);
  });

  it('treats fully unwrapped content as a single paragraph', () => {
    expect(getFormattingParagraphPlaintextsFromHtml('just some text')).toEqual(['just some text']);
  });

  // The rules keyed on a paragraph count of exactly 1 never fire on this, which is a live
  // trade-off rather than an accident — pinned here so a change to the tag list is deliberate.
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
