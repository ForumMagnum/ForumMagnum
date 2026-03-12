import React, { useState } from 'react';
import classNames from 'classnames';
import { useLocation } from '../../lib/routeUtil';
import DeferRender from '../common/DeferRender';
import { ModerationTemplatesForm } from './ModerationTemplateForm';
import { ContentItemBody } from "../contents/ContentItemBody";
import MetaInfo from "../common/MetaInfo";
import BasicFormStyles from "../form-components/BasicFormStyles";
import Row from "../common/Row";
import { defineStyles } from '../hooks/defineStyles';
import { useStyles } from '../hooks/useStyles';

const styles = defineStyles("ModerationTemplateItem", (theme: ThemeType) => ({
  root: {
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
  }
}));

export const ModerationTemplateItem = ({template}: {
  template: ModerationTemplateFragment
}) => {
  const classes = useStyles(styles);
  const [edit, setEdit] = useState<boolean>(false)

  const {hash} = useLocation()
  
  return <DeferRender ssr={false}><div className={classNames(classes.root, {[classes.deleted]: template.deleted, [classes.highlighted]: hash === `#${template._id}`})}>
    <Row>
      <h3>{template.name}{template.deleted && <> [Deleted]</>}</h3>
      <a onClick={() => setEdit(!edit)}><MetaInfo>Edit</MetaInfo></a>
    </Row>
    {edit 
      ? <BasicFormStyles>
          <ModerationTemplatesForm
            initialData={template}
            onSuccess={() => setEdit(false)}
            onCancel={() => setEdit(false)}
          />
        </BasicFormStyles>
      : <div>
          <ContentItemBody
            dangerouslySetInnerHTML={{__html: template.contents?.html ?? ''}}
          />
          <p>
            <MetaInfo>Position { template.order }</MetaInfo>
          </p>
        </div>
    }
  </div></DeferRender>
}

export default ModerationTemplateItem;



