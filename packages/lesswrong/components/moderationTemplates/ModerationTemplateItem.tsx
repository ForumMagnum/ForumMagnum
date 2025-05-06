import React, { useState } from 'react';
import classNames from 'classnames';
import { useLocation } from '../../lib/routeUtil';
import DeferRender from '../common/DeferRender';
import { Components, registerComponent } from "../../lib/vulcan-lib/components";
import { ModerationTemplatesForm } from './ModerationTemplateForm';

const styles = (theme: ThemeType) => ({
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
});

export const ModerationTemplateItem = ({classes, template}: {
  classes: ClassesType<typeof styles>,
  template: ModerationTemplateFragment
}) => {
  const { ContentItemBody, MetaInfo, BasicFormStyles, Row } = Components
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

const ModerationTemplateItemComponent = registerComponent('ModerationTemplateItem', ModerationTemplateItem, {styles});

declare global {
  interface ComponentTypes {
    ModerationTemplateItem: typeof ModerationTemplateItemComponent
  }
}

