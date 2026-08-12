import { gql } from '@/lib/generated/gql-codegen';
import type { TemplateType } from '@/lib/collections/moderationTemplates/constants';

export const ModerationTemplatesListQuery = gql(`
  query multiModerationTemplateGroupedTemplateListQuery($selector: ModerationTemplateSelector, $limit: Int, $enableTotal: Boolean) {
    moderationTemplates(selector: $selector, limit: $limit, enableTotal: $enableTotal) {
      results {
        ...ModerationTemplateFragment
      }
      totalCount
    }
  }
`);

export const UNGROUPED_TEMPLATES_LABEL = "Other";

export function getModerationTemplatesQueryVariables(collectionName: TemplateType) {
  return {
    selector: { moderationTemplatesList: { collectionName } },
    limit: 50,
    enableTotal: false,
  };
}

export function groupTemplatesByLabel(templates: ModerationTemplateFragment[]): [string, ModerationTemplateFragment[]][] {
  const grouped: Record<string, ModerationTemplateFragment[]> = {};
  const templatesWithoutGroup: ModerationTemplateFragment[] = [];

  templates.forEach(template => {
    const groupLabel = template.groupLabel;
    if (groupLabel) {
      if (!grouped[groupLabel]) {
        grouped[groupLabel] = [];
      }
      grouped[groupLabel].push(template);
    } else {
      templatesWithoutGroup.push(template);
    }
  });

  if (templatesWithoutGroup.length > 0) {
    grouped[UNGROUPED_TEMPLATES_LABEL] = templatesWithoutGroup;
  }

  return Object.entries(grouped);
}
