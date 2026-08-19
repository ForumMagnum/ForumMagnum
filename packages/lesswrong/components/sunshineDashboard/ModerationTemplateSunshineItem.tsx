import React, { useState } from 'react';
import { defineStyles, useStyles } from '../hooks/useStyles';
import LWTooltip from '../common/LWTooltip';
import { ModerationTemplatesForm } from '../moderationTemplates/ModerationTemplateForm';
import BasicFormStyles from '../form-components/BasicFormStyles';
import { ContentItemBody } from '../contents/ContentItemBody';
import classNames from 'classnames';
import { useLocation } from '../../lib/routeUtil';
import { Link } from '../../lib/reactRouterWrapper';
import ContentStyles from '../common/ContentStyles';
import ForumIcon from '../common/ForumIcon';
import type { DragHandleProps } from '../form-components/sortableList';

/** Side length of the row's checkbox. Exported so lists that align these rows against
 * other controls can centre the checkbox within a wider gutter. */
export const CHECKBOX_SIZE = 12;

const styles = defineStyles('ModerationTemplateSunshineItem', (theme: ThemeType) => ({
  templateItem: {
    cursor: "pointer",
    padding: 2,
    paddingLeft: 24,
    width: "100%",
    display: "flex",
    alignItems: "center",
    gap: 2,
    justifyContent: "space-between",
    position: "relative",
    "&:hover": {
      backgroundColor: theme.palette.greyAlpha(0.1),
    },
    '&:hover .ModerationTemplateSunshineItem-actionIcon': {
      opacity: .5,
    },
    '&:hover .ModerationTemplateSunshineItem-dragHandle': {
      opacity: .5,
    },
  },
  dragHandle: {
    position: "absolute",
    left: 5,
    top: "50%",
    transform: "translateY(-50%)",
    display: "flex",
    alignItems: "center",
    opacity: 0,
    cursor: "grab",
    color: "inherit",
    '&:hover': {
      opacity: '1 !important',
    },
  },
  dragHandleIcon: {
    fontSize: 16,
  },
  templateName: {
    flex: 1,
    minWidth: 0,
  },
  checkbox: {
    width: CHECKBOX_SIZE,
    height: CHECKBOX_SIZE,
    flexShrink: 0,
    marginRight: 4,
    border: `1px solid ${theme.palette.grey[400]}`,
    borderRadius: 2,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    borderColor: theme.palette.grey[800],
  },
  checkboxIcon: {
    fontSize: 11,
    color: theme.palette.grey[800],
  },
  actions: {
    display: "flex",
    alignItems: "center",
    flexShrink: 0,
    marginLeft: 8,
  },
  actionButton: {
    display: "flex",
    alignItems: "center",
    cursor: "pointer",
    "&:hover": {
      opacity: 0.7,
    },
  },
  editContainer: {
    border: theme.palette.border.commentBorder,
    ...theme.typography.body2,
    padding: 16,
    background: theme.palette.panelBackground.default,
    marginBottom: 16,
    marginTop: 16
  },
  deleted: {
    color: theme.palette.grey[500]
  },
  highlighted: {
    border: theme.palette.border.intense
  },
  selected: {
    backgroundColor: theme.palette.greyAlpha(0.1),
  },
  suggested: {
    fontWeight: 600,
  },
  hovercard: {
    padding: 16,
    maxWidth: 400,
    border: theme.palette.border.slightlyIntense3,
    borderRadius: theme.borderRadius.small,
    background: theme.palette.panelBackground.default,
    ...theme.typography.body2,
    ...theme.typography.commentStyle,
    // Large soft halo so the preview is readable over the busy page behind it
    boxShadow: `0 0 200px 200px ${theme.palette.boxShadowColor(0.03)}`,
    // Crop the halo at the card's right edge so it doesn't dim the sidebar
    // column the card floats next to. 500px comfortably exceeds the shadow's
    // blur+spread (400px), so the other three sides show no hard edge. Assumes
    // the card stays on the left of its row (left-start only flips to the
    // right if there's no room on the left, which this layout doesn't hit).
    clipPath: 'inset(-500px 0 -500px -500px)',
    // The comment ContentStyles on this element add vertical margins, which
    // push the card out of flush left-start alignment with the hovered row;
    // && outweighs the commentBody class regardless of injection order
    '&&': {
      marginTop: 0,
      marginBottom: 0,
    },
  },
  actionIcon: {
    fontSize: 22,
    opacity: 0,
    padding: 4,
    '&:hover': {
      opacity: '1 !important',
    },
  },
}));

export const ModerationTemplateSunshineItem = ({template, onTemplateClick, highlighted, selected, checked, dragHandleProps, onHide, onUnhide}: {
  template: ModerationTemplateFragment,
  onTemplateClick: (template: ModerationTemplateFragment) => void,
  highlighted?: boolean,
  selected?: boolean,
  // Renders a small checkbox before the name; checked while the template's text
  // is in the composer this list sits under. Omit to hide the checkbox.
  checked?: boolean,
  dragHandleProps?: DragHandleProps,
  onHide?: (template: ModerationTemplateFragment) => void,
  onUnhide?: (template: ModerationTemplateFragment) => void,
}) => {
  const classes = useStyles(styles);
  const [edit, setEdit] = useState<boolean>(false);
  const {hash} = useLocation();

  if (edit) {
    return (
        <div className={classNames(classes.editContainer, {[classes.deleted]: template.deleted, [classes.highlighted]: hash === `#${template._id}`})}>
          <BasicFormStyles>
            <ModerationTemplatesForm
              initialData={template}
              hideMetadataFields
              onSuccess={() => setEdit(false)}
              onCancel={() => setEdit(false)}
            />
          </BasicFormStyles>
        </div>
    );
  }

  return (
    <LWTooltip
      tooltip={false}
      placement="left-start"
      // Pushes the card left past the sidebar section's padding, so its
      // right edge clears the column boundary rather than overlapping the list
      distance={13}
      // Not inline-block, so the row fills the sidebar width
      As="div"
      inlineBlock={false}
      title={
        <ContentStyles contentType="comment" className={classes.hovercard}>
          <ContentItemBody
            dangerouslySetInnerHTML={{__html: template.contents?.html ?? ''}}
          />
        </ContentStyles>
      }
    >
      <div
        className={classNames(classes.templateItem, { [classes.suggested]: highlighted, [classes.selected]: selected })}
        onClick={() => onTemplateClick(template)}
      >
        {dragHandleProps && (
          <span
            className={classes.dragHandle}
            ref={dragHandleProps.ref}
            {...dragHandleProps.attributes}
            {...dragHandleProps.listeners}
            onClick={(e) => e.stopPropagation()}
          >
            <ForumIcon icon="DragIndicator" className={classes.dragHandleIcon} />
          </span>
        )}
        {checked !== undefined && (
          <span className={classNames(classes.checkbox, { [classes.checkboxChecked]: checked })}>
            {checked && <ForumIcon icon="Check" className={classes.checkboxIcon} />}
          </span>
        )}
        <span className={classes.templateName}>{template.name}</span>
        <span className={classes.actions}>
          {onHide && (
            <LWTooltip title="Hide this template for you. Other admins will still see it" placement="top">
              <a
                className={classes.actionButton}
                onClick={(e) => {
                  e.stopPropagation();
                  onHide(template);
                }}
              >
                <ForumIcon icon="NarrowArrowDown" className={classes.actionIcon} />
              </a>
            </LWTooltip>
          )}
          {onUnhide && (
            <LWTooltip title="Unhide this template" placement="top">
              <a
                className={classes.actionButton}
                onClick={(e) => {
                  e.stopPropagation();
                  onUnhide(template);
                }}
              >
                <ForumIcon icon="NarrowArrowUp" className={classes.actionIcon} />
              </a>
            </LWTooltip>
          )}
          <LWTooltip title="Edit this template" placement="top">
            <a
              className={classes.actionButton}
              onClick={(e) => {
                e.stopPropagation();
                setEdit(true);
              }}
            >
              <ForumIcon icon="Edit" className={classes.actionIcon} />
            </a>
          </LWTooltip>
          <LWTooltip title="Edit autosuggest rules" placement="top">
            <Link
              className={classes.actionButton}
              to={`/admin/supermodHighlights#${template._id}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
            >
              <ForumIcon icon="Settings" className={classes.actionIcon} />
            </Link>
          </LWTooltip>
        </span>
      </div>
    </LWTooltip>
  );
};
