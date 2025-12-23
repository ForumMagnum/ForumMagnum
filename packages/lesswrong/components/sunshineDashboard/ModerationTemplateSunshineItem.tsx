import React, { useState } from 'react';
import { defineStyles, useStyles } from '../hooks/useStyles';
import LWTooltip from '../common/LWTooltip';
import MetaInfo from '../common/MetaInfo';
import { ModerationTemplatesForm } from '../moderationTemplates/ModerationTemplateForm';
import BasicFormStyles from '../form-components/BasicFormStyles';
import { ContentItemBody } from '../contents/ContentItemBody';
import classNames from 'classnames';
import { useLocation } from '../../lib/routeUtil';
import DeferRender from '../common/DeferRender';
import Row from '../common/Row';
import PopperCard from '../common/PopperCard';
import { Card } from '@/components/widgets/Paper';
import ContentStyles from '../common/ContentStyles';
import ForumIcon from '../common/ForumIcon';

const styles = defineStyles('ModerationTemplateSunshineItem', (theme: ThemeType) => ({
  templateItem: {
    cursor: "pointer",
    padding: 2,
    paddingLeft: 8,
    display: "flex",
    alignItems: "center",
    gap: 2,
    justifyContent: "space-between",
    "&:hover": {
      backgroundColor: theme.palette.greyAlpha(0.1),
    },
    '&:hover .ModerationTemplateSunshineItem-editIcon': {
      opacity: .5,
    },
  },
  templateName: {
    flex: 1,
  },
  editButton: {
    marginLeft: theme.spacing.unit,
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
  hovercard: {
    padding: 16,
    maxWidth: 400,
    border: theme.palette.border.commentBorder,
    borderRadius: theme.borderRadius.small,
    background: theme.palette.panelBackground.default,
    ...theme.typography.body2,
    ...theme.typography.commentStyle,
  },
  editIcon: {
    fontSize: 22,
    opacity: 0,
    padding: 4,
    '&:hover': {
      opacity: '1 !important',
    },
  },
}));

export const ModerationTemplateSunshineItem = ({template, onTemplateClick}: {
  template: ModerationTemplateFragment,
  onTemplateClick: (template: ModerationTemplateFragment) => void,
}) => {
  const classes = useStyles(styles);
  const [edit, setEdit] = useState<boolean>(false);
  const {hash} = useLocation();

  if (edit) {
    return (
      <DeferRender ssr={false}>
        <div className={classNames(classes.editContainer, {[classes.deleted]: template.deleted, [classes.highlighted]: hash === `#${template._id}`})}>
          <Row>
            <h3>{template.name}{template.deleted && <> [Deleted]</>}</h3>
          </Row>
          <BasicFormStyles>
            <ModerationTemplatesForm
              initialData={template}
              onSuccess={() => setEdit(false)}
              onCancel={() => setEdit(false)}
            />
          </BasicFormStyles>
        </div>
      </DeferRender>
    );
  }

  return (
    <LWTooltip
      tooltip={false}
      placement="left-start"
      title={
        <ContentStyles contentType="comment" className={classes.hovercard}>
          <ContentItemBody
            dangerouslySetInnerHTML={{__html: template.contents?.html ?? ''}}
          />
        </ContentStyles>
      }
    >
      <div
        className={classes.templateItem}
        onClick={() => onTemplateClick(template)}
      >
        <span className={classes.templateName}>{template.name}</span>
        <a
          className={classes.editButton}
          onClick={(e) => {
            e.stopPropagation();
            setEdit(true);
          }}
        >
          <ForumIcon icon="Edit" className={classes.editIcon} />
        </a>
      </div>
    </LWTooltip>
  );
};

