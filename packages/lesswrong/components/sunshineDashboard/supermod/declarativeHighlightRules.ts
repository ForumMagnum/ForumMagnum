import {
  isCaseSensitiveRegexHighlightOperator,
  isDistinctRegexHighlightOperator,
  isItemCountRegexHighlightOperator,
  isNumericHighlightOperator,
  isRegexHighlightOperator,
  type HighlightCondition,
  type HighlightRule,
  type HighlightRuleCategory,
  type HighlightRuleOverrides,
  type ModeratorActionHighlightLevel,
  type NumericHighlightOperator,
  type RegexHighlightOperator,
} from "@/lib/moderatorHighlights/highlightRuleTypes";
import { HIGHLIGHT_SIGNALS, type HighlightSignalContext, type HighlightSignalName } from "./highlightSignals";

function compareNumbers(operator: NumericHighlightOperator, signalValue: number, target: number): boolean {
  switch (operator) {
    case 'gte': return signalValue >= target;
    case 'lte': return signalValue <= target;
    case 'gt': return signalValue > target;
    case 'lt': return signalValue < target;
    case 'eq': return signalValue === target;
  }
}

// The RegExp is constructed per call on purpose: the distinct-match path uses the `g` flag, and
// a cached global regex carries `lastIndex` between calls, which makes `.test()` alternate
// true/false across the items of a list signal.
function regexMatchesValue(
  operator: RegexHighlightOperator,
  pattern: string,
  minimumMatches: number | undefined,
  signalValue: string,
): boolean {
  const caseSensitive = isCaseSensitiveRegexHighlightOperator(operator);
  if (!isDistinctRegexHighlightOperator(operator)) {
    return new RegExp(pattern, caseSensitive ? undefined : 'i').test(signalValue);
  }

  const regex = new RegExp(pattern, caseSensitive ? 'g' : 'gi');
  const matches = new Set<string>();
  for (const match of signalValue.matchAll(regex)) {
    matches.add(caseSensitive ? match[0] : match[0].toLowerCase());
  }
  return matches.size >= (minimumMatches ?? 1);
}

function evaluateCondition(condition: HighlightCondition, ctx: HighlightSignalContext): boolean {
  const signal = HIGHLIGHT_SIGNALS[condition.signal];
  if (!signal) {
    // eslint-disable-next-line no-console
    console.error(`Highlight rule refers to an unknown signal: ${condition.signal}`);
    return false;
  }
  if (signal.type === 'boolean') {
    if (condition.operator === 'isTrue') return signal.compute(ctx);
    if (condition.operator === 'isFalse') return !signal.compute(ctx);
    return false;
  }
  if (signal.type === 'string' || signal.type === 'stringList') {
    if (!isRegexHighlightOperator(condition.operator) || typeof condition.value !== 'string') return false;
    const operator = condition.operator;
    const pattern = condition.value;
    const computedValue = signal.compute(ctx);
    const signalValues = typeof computedValue === 'string' ? [computedValue] : computedValue ?? [];
    try {
      const matchesValue = (signalValue: string) => regexMatchesValue(
        operator,
        pattern,
        condition.minimumMatches,
        signalValue,
      );
      // Item-count operators ask how many of the strings match; the rest ask whether any does.
      if (isItemCountRegexHighlightOperator(operator)) {
        return signalValues.filter(matchesValue).length >= (condition.minimumMatches ?? 1);
      }
      return signalValues.some(matchesValue);
    } catch (error) {
      // Invalid saved patterns should fail closed rather than breaking every rule evaluation.
      // eslint-disable-next-line no-console
      console.error(`Highlight rule has an invalid regex: ${condition.value}`, error);
      return false;
    }
  }
  if (!isNumericHighlightOperator(condition.operator) || typeof condition.value !== 'number') return false;
  const signalValue = signal.compute(ctx);
  // A signal with no value never satisfies a condition, so that e.g. unscored content
  // doesn't count as scoring below an LLM-score threshold
  if (signalValue === null) return false;
  return compareNumbers(condition.operator, signalValue, condition.value);
}

/**
 * Groups are alternatives: the rule matches if any of them matches, and a group matches when
 * every condition in it passes. An empty list of groups never matches; a group with no
 * conditions always matches.
 */
/**
 * An OR of ANDs, with two load-bearing edge cases: no groups never matches, and a group with no
 * conditions always matches (which is what ALWAYS relies on). Don't "clean up" empty groups.
 */
function anyGroupMatches(groups: HighlightCondition[][], ctx: HighlightSignalContext): boolean {
  return groups.some(group => group.every(condition => evaluateCondition(condition, ctx)));
}

export function highlightRuleMatches(rule: HighlightRule, ctx: HighlightSignalContext): boolean {
  return rule.enabled && anyGroupMatches(rule.groups, ctx);
}

export function evaluateActionHighlightRule(
  rule: HighlightRule,
  ctx: HighlightSignalContext,
): ModeratorActionHighlightLevel | null {
  if (!highlightRuleMatches(rule, ctx)) return null;
  return anyGroupMatches(rule.level2Groups ?? [], ctx) ? 2 : 1;
}

/** Overrides shadow defaults wholesale, keyed by moderator action name or template ID */
export function resolveHighlightRules(
  defaults: Record<string, HighlightRule>,
  overrides: HighlightRuleOverrides | null | undefined,
  category: HighlightRuleCategory,
): Record<string, HighlightRule> {
  return { ...defaults, ...overrides?.[category] };
}

export function numberCondition(
  signal: HighlightSignalName,
  operator: NumericHighlightOperator,
  value: number,
): HighlightCondition {
  return { signal, operator, value };
}

export function booleanCondition(signal: HighlightSignalName, expected: boolean): HighlightCondition {
  return { signal, operator: expected ? 'isTrue' : 'isFalse', value: null };
}

export function regexCondition(
  signal: HighlightSignalName,
  pattern: string,
  operator: RegexHighlightOperator = 'matchesRegex',
  explanation?: string,
): HighlightCondition {
  return { signal, operator, value: pattern, ...(explanation ? { explanation } : {}) };
}

/** Matches when at least `minimumItems` of a text-list signal's strings match the pattern. */
export function matchingItemsRegexCondition(
  signal: HighlightSignalName,
  pattern: string,
  minimumItems: number,
  caseSensitive = false,
  explanation?: string,
): HighlightCondition {
  return {
    signal,
    operator: caseSensitive ? 'matchesRegexInAtLeastItemsCaseSensitive' : 'matchesRegexInAtLeastItems',
    value: pattern,
    minimumMatches: minimumItems,
    ...(explanation ? { explanation } : {}),
  };
}

export function distinctRegexMatchesCondition(
  signal: HighlightSignalName,
  pattern: string,
  minimumMatches: number,
  caseSensitive = false,
  explanation?: string,
): HighlightCondition {
  return {
    signal,
    operator: caseSensitive
      ? 'hasAtLeastDistinctRegexMatchesCaseSensitive'
      : 'hasAtLeastDistinctRegexMatches',
    value: pattern,
    minimumMatches,
    ...(explanation ? { explanation } : {}),
  };
}

/** For rules that should always reach level 2 once they match at all */
/** One empty group, i.e. always matches. See anyGroupMatches. */
export const ALWAYS: HighlightCondition[][] = [[]];
