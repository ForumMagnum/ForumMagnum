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

// Built per call: a cached /g regex's lastIndex would break .test() on lists.
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
      if (isItemCountRegexHighlightOperator(operator)) {
        return signalValues.filter(matchesValue).length >= (condition.minimumMatches ?? 1);
      }
      return signalValues.some(matchesValue);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(`Highlight rule has an invalid regex: ${condition.value}`, error);
      return false;
    }
  }
  if (!isNumericHighlightOperator(condition.operator) || typeof condition.value !== 'number') return false;
  const signalValue = signal.compute(ctx);
  if (signalValue === null) return false;
  return compareNumbers(condition.operator, signalValue, condition.value);
}

// No groups never matches; an empty group always matches (see ALWAYS).
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

/** One empty group, i.e. always matches. */
export const ALWAYS: HighlightCondition[][] = [[]];
