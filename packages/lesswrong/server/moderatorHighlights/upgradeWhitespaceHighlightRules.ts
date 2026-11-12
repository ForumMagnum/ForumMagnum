import type { HighlightCondition, HighlightRuleOverrides, HighlightRuleTemplateReference } from '@/lib/moderatorHighlights/highlightRuleTypes';

/** A blank line between (nearly) every paragraph, over at least four paragraphs. */
export const BLANK_LINE_FORMATTING_GROUP: HighlightCondition[] = [
  { signal: 'focusedBlankLineCount', operator: 'gte', value: 3 },
  { signal: 'focusedBlankLineRatio', operator: 'gte', value: 0.4 },
];

function alreadyChecksBlankLines(groups: HighlightCondition[][]): boolean {
  return groups.some(group => group.some(condition => condition.signal === 'focusedBlankLineCount'));
}

export function upgradeWhitespaceHighlightRules(
  overrides: HighlightRuleOverrides,
  templates: HighlightRuleTemplateReference[],
): HighlightRuleOverrides {
  const rejectionTemplates = { ...overrides.rejectionTemplates };
  for (const template of templates) {
    if (template.collectionName !== 'Rejections' || !template.name.toLowerCase().includes('formatting')) continue;
    const rule = rejectionTemplates[template._id];
    // Additive, so moderator-customized groups and cutoffs are left alone.
    if (!rule || alreadyChecksBlankLines(rule.groups)) continue;
    rejectionTemplates[template._id] = {
      ...rule,
      groups: [...rule.groups, BLANK_LINE_FORMATTING_GROUP.map(condition => ({ ...condition }))],
    };
  }
  return { ...overrides, rejectionTemplates };
}
