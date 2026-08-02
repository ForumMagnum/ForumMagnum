import React, { useState } from 'react';
import { useQuery } from '@/lib/crud/useQuery';
import { gql } from '@/lib/generated/gql-codegen';
import { defineStyles, useStyles } from '../hooks/useStyles';
import { ModerationTemplateSunshineItem } from './ModerationTemplateSunshineItem';
import { ModerationTemplatesForm } from '../moderationTemplates/ModerationTemplateForm';
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

const UNGROUPED_LABEL = "Other";

export function getModerationTemplatesQueryVariables(collectionName: TemplateType) {
  return {
    selector: { moderationTemplatesList: { collectionName } },
    limit: 50,
    enableTotal: false,
  };
}

function groupTemplatesByLabel(templates: ModerationTemplateFragment[]): [string, ModerationTemplateFragment[]][] {
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
    grouped[UNGROUPED_LABEL] = templatesWithoutGroup;
  }

  return Object.entries(grouped);
}

const styles = defineStyles('GroupedModerationTemplateList', (theme: ThemeType) => ({
  root: {
    marginTop: 32,
    opacity: 0.5,
    display: 'flex',
    flexDirection: 'column',
    "&:hover": {
      opacity: 1,
    },
  },
  templateGroup: {
    marginBottom: 16,
    display: 'flex',
    flexDirection: 'column',
    '& h3': {
      marginBottom: 8,
    },
  },
  newTemplateButton: {
    flexShrink: 0,
    cursor: 'pointer',
    fontSize: 12,
    fontWeight: 600,
    textTransform: 'uppercase',
    color: theme.palette.grey[600],
    letterSpacing: '0.5px',
  },
  newTemplateForm: {
    marginTop: 16,
    paddingLeft: 12,
    paddingRight: 0,
    marginLeft: -6,
    marginRight: -6,
    border: theme.palette.border.normal,
    borderRadius: 4,
    backgroundColor: theme.palette.background.paper,
    '& .vulcan-form': {
      marginTop: -16
    },
  },
}));

/**
 * The list of moderation templates shown underneath a moderator-facing composer,
 * grouped by `groupLabel`. Used for both message templates and rejection-reason
 * templates; clicking a template appends it to whichever editor is open.
 */
export const GroupedModerationTemplateList = ({ collectionName, onTemplateClick, highlightedTemplateNames }: {
  collectionName: TemplateType,
  onTemplateClick: (template: ModerationTemplateFragment) => void,
  highlightedTemplateNames?: Set<string>,
}) => {
  const classes = useStyles(styles);
  const [showNewTemplateForm, setShowNewTemplateForm] = useState(false);

  const queryVariables = getModerationTemplatesQueryVariables(collectionName);
  const { data } = useQuery(ModerationTemplatesListQuery, { variables: queryVariables });

  const templates = data?.moderationTemplates?.results ?? [];
  const groupedTemplates = groupTemplatesByLabel(templates);

  return <div className={classes.root}>
    {groupedTemplates.map(([group, templatesInGroup]) => (
      <div key={group} className={classes.templateGroup}>
        <h3>{group}</h3>
        {templatesInGroup.map(template => (
          <ModerationTemplateSunshineItem
            key={template._id}
            template={template}
            onTemplateClick={onTemplateClick}
            highlighted={highlightedTemplateNames?.has(template.name)}
          />
        ))}
      </div>
    ))}
    <div className={classes.newTemplateButton} onClick={() => setShowNewTemplateForm(true)}>
      New {collectionName === "Rejections" ? "Rejection Reason" : "Mod Template"}
    </div>
    {showNewTemplateForm && (
      <div className={classes.newTemplateForm}>
        <ModerationTemplatesForm
          initialCollectionName={collectionName}
          onSuccess={() => setShowNewTemplateForm(false)}
          onCancel={() => setShowNewTemplateForm(false)}
          refetchQueries={[{ query: ModerationTemplatesListQuery, variables: queryVariables }]}
        />
      </div>
    )}
  </div>;
};

export default GroupedModerationTemplateList;
