// TODO: Import component in components.ts
import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib';
import { useTracking } from "../../lib/analyticsEvents";
import { useUpdateCurrentUser } from '../hooks/useUpdateCurrentUser';

const styles = (theme: ThemeType) => ({
  root: {

  }
});

export const GlossaryEditFormNewPost = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  const { captureEvent } = useTracking(); //it is virtuous to add analytics tracking to new components

  return <div className={classes.root}>

  </div>;
}

const GlossaryEditFormNewPostComponent = registerComponent('GlossaryEditFormNewPost', GlossaryEditFormNewPost, {styles});

declare global {
  interface ComponentTypes {
    GlossaryEditFormNewPost: typeof GlossaryEditFormNewPostComponent
  }
}
