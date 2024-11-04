// TODO: Import component in components.ts
import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib';
import { useTracking } from "../../lib/analyticsEvents";
import { useUpdateCurrentUser } from '../hooks/useUpdateCurrentUser';
import { commentBodyStyles } from '@/themes/stylePiping';

const styles = (theme: ThemeType) => ({
  root: {
    ...commentBodyStyles(theme),
    color: theme.palette.grey[500],
  },
  title: {
    marginRight: 10,
    color: theme.palette.grey[900],
    fontSize: '1.25rem'
  }
});

export const GlossaryEditFormNewPost = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  const { captureEvent } = useTracking(); //it is virtuous to add analytics tracking to new components

  return <div className={classes.root}>
    <span className={classes.title}>Glossary [Beta]</span> Save this post once, to start generating/editing a jargon glossary
  </div>;
}

const GlossaryEditFormNewPostComponent = registerComponent('GlossaryEditFormNewPost', GlossaryEditFormNewPost, {styles});

declare global {
  interface ComponentTypes {
    GlossaryEditFormNewPost: typeof GlossaryEditFormNewPostComponent
  }
}
