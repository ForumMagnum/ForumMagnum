// TODO: Import component in components.ts
import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useTracking } from "../../lib/analyticsEvents";

const styles = (theme: ThemeType) => ({
  root: {

  }
});

export const GlossaryEditFormWrapper = ({classes, document}: {
  classes: ClassesType<typeof styles>,
  document: PostsEditQueryFragment,
}) => {
  const { GlossaryEditFormNewPost, GlossaryEditForm } = Components;

  if (!document._id) return <GlossaryEditFormNewPost />
  return <div className={classes.root}>
    <GlossaryEditForm document={document} />
  </div>;
}

const GlossaryEditFormWrapperComponent = registerComponent('GlossaryEditFormWrapper', GlossaryEditFormWrapper, {styles});

declare global {
  interface ComponentTypes {
    GlossaryEditFormWrapper: typeof GlossaryEditFormWrapperComponent
  }
}
