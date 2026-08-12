import React from 'react';
import classNames from 'classnames';
import { useQuery } from '@/lib/crud/useQuery';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import { ModerationTemplatesListQuery, getModerationTemplatesQueryVariables, groupTemplatesByLabel } from '../moderationTemplatesShared';
import type { TemplateType } from '@/lib/collections/moderationTemplates/constants';

const styles = defineStyles('HighlightedTemplatesPreview', (theme: ThemeType) => ({
  root: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
    '&:not(:empty)': {
      marginBottom: 8,
    },
  },
  column: {
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
  },
  // Message templates sit on the left, rejection templates on the right,
  // mirroring the Send DM / Reject tabs above them
  messageColumn: {
    alignItems: 'flex-start',
  },
  rejectionColumn: {
    alignItems: 'flex-end',
    textAlign: 'right',
    marginLeft: 'auto',
  },
  groupLabel: {
    fontSize: 11,
    fontWeight: 600,
    lineHeight: '16px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    color: theme.palette.grey[600],
    marginBottom: 2,
  },
  // Same look as a highlighted row in the full template list, but only as wide as its label
  templateButton: {
    cursor: 'pointer',
    padding: '2px 8px',
    fontSize: 13,
    fontWeight: 600,
    backgroundColor: theme.palette.grey[900],
    color: theme.palette.grey[100],
    borderRadius: 4,
    marginBottom: 2,
    '&:hover': {
      backgroundColor: theme.palette.grey[800],
    },
  },
}));

const HighlightedTemplateColumn = ({collectionName, highlightedTemplateNames, onTemplateClick, alignRight}: {
  collectionName: TemplateType,
  highlightedTemplateNames: Set<string>,
  onTemplateClick: (template: ModerationTemplateFragment) => void,
  alignRight?: boolean,
}) => {
  const classes = useStyles(styles);
  const { data } = useQuery(ModerationTemplatesListQuery, {
    variables: getModerationTemplatesQueryVariables(collectionName),
    skip: highlightedTemplateNames.size === 0,
  });
  const templates = data?.moderationTemplates?.results ?? [];
  const highlightedTemplates = templates.filter(template => highlightedTemplateNames.has(template.name));
  if (highlightedTemplates.length === 0) return null;

  const highlightedGroups = groupTemplatesByLabel(highlightedTemplates);
  return (
    <div className={classNames(classes.column, alignRight ? classes.rejectionColumn : classes.messageColumn)}>
      {highlightedGroups.map(([group, templatesInGroup]) => (
        <React.Fragment key={group}>
          <div className={classes.groupLabel}>{group}</div>
          {templatesInGroup.map(template => (
            <div key={template._id} className={classes.templateButton} onClick={() => onTemplateClick(template)}>
              {template.name}
            </div>
          ))}
        </React.Fragment>
      ))}
    </div>
  );
};

/**
 * Highlighted (rule-suggested) moderation templates, shown in the sidebar
 * before the Send DM / Reject sections have been opened. Clicking a template
 * opens the matching section with that template already applied.
 */
const HighlightedTemplatesPreview = ({showMessageTemplates, showRejectionTemplates, highlightedMessageTemplateNames, highlightedRejectionTemplateNames, onMessageTemplateClick, onRejectionTemplateClick}: {
  showMessageTemplates: boolean,
  showRejectionTemplates: boolean,
  highlightedMessageTemplateNames: Set<string>,
  highlightedRejectionTemplateNames: Set<string>,
  onMessageTemplateClick: (template: ModerationTemplateFragment) => void,
  onRejectionTemplateClick: (template: ModerationTemplateFragment) => void,
}) => {
  const classes = useStyles(styles);
  return (
    <div className={classes.root}>
      {showMessageTemplates && (
        <HighlightedTemplateColumn
          collectionName="Messages"
          highlightedTemplateNames={highlightedMessageTemplateNames}
          onTemplateClick={onMessageTemplateClick}
        />
      )}
      {showRejectionTemplates && (
        <HighlightedTemplateColumn
          collectionName="Rejections"
          highlightedTemplateNames={highlightedRejectionTemplateNames}
          onTemplateClick={onRejectionTemplateClick}
          alignRight
        />
      )}
    </div>
  );
};

export default HighlightedTemplatesPreview;
