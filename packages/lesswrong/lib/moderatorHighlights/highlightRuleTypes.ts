/**
 * Serializable representation of the supermod highlight rules (which moderator actions,
 * message templates and rejection templates get called out for a given user).
 *
 * Rules that are just thresholds on some property of the user or their content are
 * expressed in this format, which means they can be edited from /admin/supermodHighlights
 * without a deploy. Rules that need real logic (regexes over content, formatting
 * heuristics, duplicate detection) stay as code predicates in templateHighlightRules.ts.
 *
 * The defaults live in code; this format is only used for the sparse set of overrides
 * stored in the DatabaseMetadata row named by HIGHLIGHT_RULE_OVERRIDES_METADATA_NAME.
 */

export const HIGHLIGHT_RULE_OVERRIDES_METADATA_NAME = 'supermodHighlightRuleOverrides';

export const highlightRuleCategories = ['actions', 'messageTemplates', 'rejectionTemplates'] as const;

export type HighlightRuleCategory = typeof highlightRuleCategories[number];

export const numericHighlightOperators = ['gte', 'lte', 'gt', 'lt', 'eq'] as const;
export const booleanHighlightOperators = ['isTrue', 'isFalse'] as const;

export type NumericHighlightOperator = typeof numericHighlightOperators[number];
export type BooleanHighlightOperator = typeof booleanHighlightOperators[number];
export type HighlightConditionOperator = NumericHighlightOperator | BooleanHighlightOperator;

const allHighlightOperators: HighlightConditionOperator[] = [...numericHighlightOperators, ...booleanHighlightOperators];

export const highlightOperatorLabels: Record<HighlightConditionOperator, string> = {
  gte: 'is at least',
  lte: 'is at most',
  gt: 'is more than',
  lt: 'is less than',
  eq: 'is exactly',
  isTrue: 'is true',
  isFalse: 'is false',
};

export interface HighlightCondition {
  signal: string;
  operator: HighlightConditionOperator;
  /** Only meaningful for the numeric operators; null for isTrue/isFalse */
  value: number | null;
}

export interface HighlightRule {
  enabled: boolean;
  /** The rule matches if any group matches. A group matches if all of its conditions pass. */
  groups: HighlightCondition[][];
  /**
   * Moderator actions only. A matching action is highlighted at level 1 unless one of these
   * groups also matches, which promotes it to level 2 (see actionHighlightRules.ts).
   */
  level2Groups?: HighlightCondition[][];
}

/** Sparse: only rules that have been edited appear here, keyed by action name or template name. */
export type HighlightRuleOverrides = Record<HighlightRuleCategory, Record<string, HighlightRule>>;

/**
 * A moderator action can be highlighted at either of two levels:
 * - Level 1: it shows up above the fold in the collapsed row, and gets a subtle outline expanded.
 * - Level 2: it also gets a per-action colored outline in both views.
 */
export type ModeratorActionHighlightLevel = 1 | 2;

export function emptyHighlightRuleOverrides(): HighlightRuleOverrides {
  return { actions: {}, messageTemplates: {}, rejectionTemplates: {} };
}

export function isNumericHighlightOperator(operator: HighlightConditionOperator): operator is NumericHighlightOperator {
  return numericHighlightOperators.some(candidate => candidate === operator);
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseCondition(value: unknown): HighlightCondition {
  if (!isPlainObject(value)) throw new Error("Highlight condition must be an object");
  const { signal, operator, value: conditionValue } = value;
  if (typeof signal !== 'string' || !signal) throw new Error("Highlight condition is missing a signal");
  if (typeof operator !== 'string') throw new Error("Highlight condition is missing an operator");
  const parsedOperator = allHighlightOperators.find(candidate => candidate === operator);
  if (!parsedOperator) throw new Error(`Unrecognized highlight condition operator: ${operator}`);
  if (isNumericHighlightOperator(parsedOperator)) {
    if (typeof conditionValue !== 'number' || !isFinite(conditionValue)) {
      throw new Error(`Highlight condition on "${signal}" needs a numeric value`);
    }
    return { signal, operator: parsedOperator, value: conditionValue };
  }
  return { signal, operator: parsedOperator, value: null };
}

function parseGroups(value: unknown, description: string): HighlightCondition[][] {
  if (!Array.isArray(value)) throw new Error(`${description} must be an array of condition groups`);
  return value.map(group => {
    if (!Array.isArray(group)) throw new Error(`${description} must contain arrays of conditions`);
    return group.map(parseCondition);
  });
}

function parseRule(value: unknown): HighlightRule {
  if (!isPlainObject(value)) throw new Error("Highlight rule must be an object");
  const { enabled, groups, level2Groups } = value;
  if (typeof enabled !== 'boolean') throw new Error("Highlight rule is missing an `enabled` flag");
  return {
    enabled,
    groups: parseGroups(groups, "Highlight rule conditions"),
    ...(level2Groups === undefined ? {} : { level2Groups: parseGroups(level2Groups, "Level 2 conditions") }),
  };
}

function serializeGroups(groups: HighlightCondition[][]): JsonArray {
  return groups.map(group => group.map(condition => ({
    signal: condition.signal,
    operator: condition.operator,
    value: condition.value,
  })));
}

function serializeRule(rule: HighlightRule): JsonRecord {
  return {
    enabled: rule.enabled,
    groups: serializeGroups(rule.groups),
    ...(rule.level2Groups === undefined ? {} : { level2Groups: serializeGroups(rule.level2Groups) }),
  };
}

/** Drops anything not part of the format, so only known fields reach the database */
export function serializeHighlightRuleOverrides(overrides: HighlightRuleOverrides): JsonRecord {
  const serialized: JsonRecord = {};
  for (const category of highlightRuleCategories) {
    const rulesForCategory: JsonRecord = {};
    for (const [key, rule] of Object.entries(overrides[category])) {
      rulesForCategory[key] = serializeRule(rule);
    }
    serialized[category] = rulesForCategory;
  }
  return serialized;
}

/** Throws on anything malformed; callers reading from the database should catch. */
export function parseHighlightRuleOverrides(value: unknown): HighlightRuleOverrides {
  if (!isPlainObject(value)) throw new Error("Highlight rule overrides must be an object");
  const parsed = emptyHighlightRuleOverrides();
  for (const category of highlightRuleCategories) {
    const rulesForCategory = value[category];
    if (rulesForCategory === undefined) continue;
    if (!isPlainObject(rulesForCategory)) throw new Error(`Highlight rule overrides for "${category}" must be an object`);
    for (const [key, rule] of Object.entries(rulesForCategory)) {
      parsed[category][key] = parseRule(rule);
    }
  }
  return parsed;
}
