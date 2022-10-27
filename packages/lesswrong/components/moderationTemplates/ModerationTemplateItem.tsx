import React from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    ...theme.typography.body2
  }
});

export const ModerationTemplateItem = ({classes, template}: {
  classes: ClassesType,
  template: any
}) => {
  const { ContentItemBody } = Components
  return <div className={classes.root}>
    <div>{template.name}</div>
    <ContentItemBody
      dangerouslySetInnerHTML={{__html: template.contents?.html ?? ''}}
      // description={`${template.documentType} ${template.document._id}`}
    />
  </div>
}

const ModerationTemplateItemComponent = registerComponent('ModerationTemplateItem', ModerationTemplateItem, {styles});

declare global {
  interface ComponentTypes {
    ModerationTemplateItem: typeof ModerationTemplateItemComponent
  }
}

