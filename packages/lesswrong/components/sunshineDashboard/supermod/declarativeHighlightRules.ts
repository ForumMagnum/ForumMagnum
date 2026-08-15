import {
  isNumericHighlightOperator,
  type HighlightCondition,
  type HighlightRule,
  type HighlightRuleCategory,
  type HighlightRuleOverrides,
  type ModeratorActionHighlightLevel,
  type NumericHighlightOperator,
} from "@/lib/moderatorHighlights/highlightRuleTypes";
import { HIGHLIGHT_SIGNALS, type HighlightSignalContext, type HighlightSignalName } from "./highlightSignals";

/** Evaluation of the editable (threshold-shaped) highlight rules. */

function compareNumbers(operator: NumericHighlightOperator, signalValue: number, target: number): boolean {
  switch (operator) {
    case 'gte': return signalValue >= target;
    case 'lte': return signalValue <= target;
    case 'gt': return signalValue > target;
    case 'lt': return signalValue < target;
    case 'eq': return signalValue === target;
  }
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
  if (!isNumericHighlightOperator(condition.operator) || condition.value === null) return false;
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

/** Overrides shadow defaults wholesale, keyed by moderator action name or template name */
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

/** For rules that should always reach level 2 once they match at all */
export const ALWAYS: HighlightCondition[][] = [[]];
