import type { HighlightCondition, HighlightRuleOverrides, HighlightRuleTemplateReference } from '@/lib/moderatorHighlights/highlightRuleTypes';

function upgradeOffsiteGroup(group: HighlightCondition[]): HighlightCondition[] {
  // Only replace the shipped short-content heuristic, preserving custom cutoffs.
  if (group.length !== 2
    || !group.some(condition => condition.signal === 'focusedTextLength' && condition.operator === 'lt' && condition.value === 600)
  ) return group;

  const singleLink = group.find(condition => condition.signal === 'focusedLinkCount' && condition.operator === 'eq' && condition.value === 1);
  if (singleLink) return [singleLink];
  if (group.some(condition => condition.signal === 'focusedHasLinkpostUrl' && condition.operator === 'isTrue')) {
    return [{ signal: 'focusedHasOffsiteLink', operator: 'isTrue', value: null }];
  }
  return group;
}

export function upgradeOffsiteHighlightRules(
  overrides: HighlightRuleOverrides,
  templates: HighlightRuleTemplateReference[],
): HighlightRuleOverrides {
  const rejectionTemplates = { ...overrides.rejectionTemplates };
  for (const template of templates) {
    if (template.collectionName !== 'Rejections' || !template.name.toLowerCase().includes('offsite')) continue;
    const rule = rejectionTemplates[template._id];
    if (rule) rejectionTemplates[template._id] = { ...rule, groups: rule.groups.map(upgradeOffsiteGroup) };
  }
  return { ...overrides, rejectionTemplates };
}
