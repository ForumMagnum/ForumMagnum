

export const HIGHLIGHT_RULE_OVERRIDES_METADATA_NAME = 'supermodHighlightRuleOverrides';

export const highlightRuleCategories = ['actions', 'messageTemplates', 'rejectionTemplates'] as const;

export type HighlightRuleCategory = typeof highlightRuleCategories[number];

export const numericHighlightOperators = ['gte', 'lte', 'gt', 'lt', 'eq'] as const;
export const booleanHighlightOperators = ['isTrue', 'isFalse'] as const;
export const regexHighlightOperators = [
  'matchesRegex',
  'matchesRegexCaseSensitive',
  'hasAtLeastDistinctRegexMatches',
  'hasAtLeastDistinctRegexMatchesCaseSensitive',
  'matchesRegexInAtLeastItems',
  'matchesRegexInAtLeastItemsCaseSensitive',
] as const;

export type NumericHighlightOperator = typeof numericHighlightOperators[number];
export type BooleanHighlightOperator = typeof booleanHighlightOperators[number];
export type RegexHighlightOperator = typeof regexHighlightOperators[number];
export type HighlightConditionOperator = NumericHighlightOperator | BooleanHighlightOperator | RegexHighlightOperator;

const allHighlightOperators: HighlightConditionOperator[] = [
  ...numericHighlightOperators,
  ...booleanHighlightOperators,
  ...regexHighlightOperators,
];

export const highlightOperatorLabels: Record<HighlightConditionOperator, string> = {
  gte: 'is at least',
  lte: 'is at most',
  gt: 'is more than',
  lt: 'is less than',
  eq: 'is exactly',
  isTrue: 'is true',
  isFalse: 'is false',
  matchesRegex: 'matches regex (ignore case)',
  matchesRegexCaseSensitive: 'matches regex (case-sensitive)',
  hasAtLeastDistinctRegexMatches: 'has at least this many distinct regex matches (ignore case)',
  hasAtLeastDistinctRegexMatchesCaseSensitive: 'has at least this many distinct regex matches (case-sensitive)',
  matchesRegexInAtLeastItems: 'matches regex in at least this many items (ignore case)',
  matchesRegexInAtLeastItemsCaseSensitive: 'matches regex in at least this many items (case-sensitive)',
};

export interface HighlightCondition {
  signal: string;
  operator: HighlightConditionOperator;
  value: number | string | null;
  minimumMatches?: number;
  /**
   * Round-trips through the editor and the database but is not rendered anywhere yet; it's for
   * the "why was this suggested?" tooltip that lands with the inbox UI PR.
   */
  explanation?: string;
}

export interface HighlightRule {
  enabled: boolean;
  groups: HighlightCondition[][];
  level2Groups?: HighlightCondition[][];
}

export type HighlightRuleOverrides = Record<HighlightRuleCategory, Record<string, HighlightRule>>;

export interface HighlightRuleTemplateReference {
  _id: string;
  name: string;
  collectionName: string;
}

export type ModeratorActionHighlightLevel = 1 | 2;

export function emptyHighlightRuleOverrides(): HighlightRuleOverrides {
  return { actions: {}, messageTemplates: {}, rejectionTemplates: {} };
}

function migrateLegacyTemplateRuleCategory(
  rules: Record<string, HighlightRule>,
  collectionName: string,
  templates: HighlightRuleTemplateReference[],
): Record<string, HighlightRule> {
  const matchingTemplates = templates.filter(template => template.collectionName === collectionName);
  const templateIds = new Set(matchingTemplates.map(template => template._id));
  const templateIdsByLegacyName = new Map<string, string>();
  for (const template of matchingTemplates) {
    templateIdsByLegacyName.set(template.name, template._id);
    templateIdsByLegacyName.set(template.name.trim(), template._id);
  }

  const migrated: Record<string, HighlightRule> = {};
  for (const [key, rule] of Object.entries(rules)) {
    if (!templateIds.has(key)) {
      migrated[templateIdsByLegacyName.get(key) ?? key] = rule;
    }
  }

  for (const [key, rule] of Object.entries(rules)) {
    if (templateIds.has(key)) migrated[key] = rule;
  }
  return migrated;
}

/**
 * Overrides used to be keyed by template name; this re-keys them by template _id on every read
 * and write. There is no production data in this shape — the overrides row itself is new in this
 * PR — so this only rescues rows written by a dev running the earlier
 * `cursor/highlighted-moderator-actions-b4d9` branch, and can be deleted once those are gone.
 */
export function migrateLegacyTemplateRuleOverrideKeys(
  overrides: HighlightRuleOverrides,
  templates: HighlightRuleTemplateReference[],
): HighlightRuleOverrides {
  return {
    actions: overrides.actions,
    messageTemplates: migrateLegacyTemplateRuleCategory(overrides.messageTemplates, 'Messages', templates),
    rejectionTemplates: migrateLegacyTemplateRuleCategory(overrides.rejectionTemplates, 'Rejections', templates),
  };
}

export function isNumericHighlightOperator(operator: HighlightConditionOperator): operator is NumericHighlightOperator {
  return numericHighlightOperators.some(candidate => candidate === operator);
}

export function isRegexHighlightOperator(operator: HighlightConditionOperator): operator is RegexHighlightOperator {
  return regexHighlightOperators.some(candidate => candidate === operator);
}

export function isDistinctRegexHighlightOperator(operator: HighlightConditionOperator): operator is RegexHighlightOperator {
  return operator === 'hasAtLeastDistinctRegexMatches'
    || operator === 'hasAtLeastDistinctRegexMatchesCaseSensitive';
}

export function isItemCountRegexHighlightOperator(operator: HighlightConditionOperator): operator is RegexHighlightOperator {
  return operator === 'matchesRegexInAtLeastItems'
    || operator === 'matchesRegexInAtLeastItemsCaseSensitive';
}

export function highlightOperatorUsesMinimumMatches(operator: HighlightConditionOperator): boolean {
  return isDistinctRegexHighlightOperator(operator) || isItemCountRegexHighlightOperator(operator);
}

export function isCaseSensitiveRegexHighlightOperator(operator: HighlightConditionOperator): boolean {
  return operator === 'matchesRegexCaseSensitive'
    || operator === 'hasAtLeastDistinctRegexMatchesCaseSensitive'
    || operator === 'matchesRegexInAtLeastItemsCaseSensitive';
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseCondition(value: unknown): HighlightCondition {
  if (!isPlainObject(value)) throw new Error("Highlight condition must be an object");
  const { signal, operator, value: conditionValue, minimumMatches, explanation } = value;
  if (typeof signal !== 'string' || !signal) throw new Error("Highlight condition is missing a signal");
  if (typeof operator !== 'string') throw new Error("Highlight condition is missing an operator");
  if (explanation !== undefined && typeof explanation !== 'string') {
    throw new Error(`Highlight condition on "${signal}" needs a text explanation`);
  }
  const explanationField = explanation === undefined ? {} : { explanation };
  const parsedOperator = allHighlightOperators.find(candidate => candidate === operator);
  if (!parsedOperator) throw new Error(`Unrecognized highlight condition operator: ${operator}`);
  if (isNumericHighlightOperator(parsedOperator)) {
    if (typeof conditionValue !== 'number' || !isFinite(conditionValue)) {
      throw new Error(`Highlight condition on "${signal}" needs a numeric value`);
    }
    return { signal, operator: parsedOperator, value: conditionValue, ...explanationField };
  }
  if (isRegexHighlightOperator(parsedOperator)) {
    if (typeof conditionValue !== 'string') {
      throw new Error(`Highlight condition on "${signal}" needs a regex pattern`);
    }
    try {
      new RegExp(conditionValue, isCaseSensitiveRegexHighlightOperator(parsedOperator) ? undefined : 'i');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Invalid regular expression';
      throw new Error(`Highlight condition on "${signal}" has an invalid regex: ${message}`);
    }
    if (highlightOperatorUsesMinimumMatches(parsedOperator)) {
      if (typeof minimumMatches !== 'number' || !Number.isInteger(minimumMatches) || minimumMatches < 1) {
        throw new Error(`Highlight condition on "${signal}" needs a positive integer minimum match count`);
      }
      return { signal, operator: parsedOperator, value: conditionValue, minimumMatches, ...explanationField };
    }
    return { signal, operator: parsedOperator, value: conditionValue, ...explanationField };
  }
  return { signal, operator: parsedOperator, value: null, ...explanationField };
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
    ...(condition.minimumMatches === undefined ? {} : { minimumMatches: condition.minimumMatches }),
    ...(condition.explanation === undefined ? {} : { explanation: condition.explanation }),
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
