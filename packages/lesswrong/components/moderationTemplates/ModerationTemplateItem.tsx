import React, { useState } from 'react';
import { ModerationTemplates } from '../../lib/collections/moderationTemplates';
import { registerComponent, Components, getFragment } from '../../lib/vulcan-lib';
import classNames from 'classnames';
import { useLocation } from '../../lib/routeUtil';
import { NoSSR } from '../../lib/utils/componentsWithChildren';

const styles = (theme: ThemeType): JssStyles => ({
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
  classes: ClassesType,
  template: ModerationTemplateFragment
}) => {
  const { ContentItemBody, MetaInfo, WrappedSmartForm, BasicFormStyles, Row } = Components
  const [edit, setEdit] = useState<boolean>(false)

  const {hash} = useLocation()
  
  return <NoSSR><div className={classNames(classes.root, {[classes.deleted]: template.deleted, [classes.highlighted]: hash === `#${template._id}`})}>
    <Row>
      <h3>{template.name}{template.deleted && <> [Deleted]</>}</h3>
      <a onClick={() => setEdit(!edit)}><MetaInfo>Edit</MetaInfo></a>
    </Row>
    {edit 
      ? <BasicFormStyles>
          <WrappedSmartForm
            collectionName="ModerationTemplates"
            documentId={template._id}
            mutationFragment={getFragment('ModerationTemplateFragment')}
            queryFragment={getFragment('ModerationTemplateFragment')}
            successCallback={() => setEdit(false)}
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
  </div></NoSSR>
}

const ModerationTemplateItemComponent = registerComponent('ModerationTemplateItem', ModerationTemplateItem, {styles});

declare global {
  interface ComponentTypes {
    ModerationTemplateItem: typeof ModerationTemplateItemComponent
  }
}

