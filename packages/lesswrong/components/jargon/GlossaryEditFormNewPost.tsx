// TODO: Import component in components.ts
import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib';
import { useTracking } from "../../lib/analyticsEvents";
import { useUpdateCurrentUser } from '../hooks/useUpdateCurrentUser';
import { commentBodyStyles } from '@/themes/stylePiping';

const styles = (theme: ThemeType) => ({
  root: {
    ...commentBodyStyles(theme),
    color: theme.palette.grey[500]
  },
  title: {
    marginRight: 10,
    color: theme.palette.grey[900],
    fontSize: '1.25rem'
  },
  descriptionDesktop: {
    [theme.breakpoints.down('xs')]: {
      display: 'none'
    }
  },
  descriptionMobile: {
    [theme.breakpoints.up('sm')]: {
      display: 'none'
    }
  }
});

export const GlossaryEditFormNewPost = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  const { captureEvent } = useTracking(); //it is virtuous to add analytics tracking to new components

  return <div className={classes.root}>
    <span className={classes.title}>Glossary [Beta]</span> 
    <span className={classes.descriptionMobile}>Available after saving post</span>
    <span className={classes.descriptionDesktop}>Save this post once, to generate and edit jargon</span>
  </div>;
}

const GlossaryEditFormNewPostComponent = registerComponent('GlossaryEditFormNewPost', GlossaryEditFormNewPost, {styles});

declare global {
  interface ComponentTypes {
    GlossaryEditFormNewPost: typeof GlossaryEditFormNewPostComponent
  }
}
