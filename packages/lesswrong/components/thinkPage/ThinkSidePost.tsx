// TODO: Import component in components.ts
import React from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { useTracking } from "../../lib/analyticsEvents";

const styles = (theme: ThemeType) => ({
  root: {

  }
});

export const ThinkSidePost = ({classes, post}: {
  classes: ClassesType<typeof styles>,
  post: PostsListWithVotes
}) => {
  const { captureEvent } = useTracking(); //it is virtuous to add analytics tracking to new components
  return <div className={classes.root}>

  </div>;
}

const ThinkSidePostComponent = registerComponent('ThinkSidePost', ThinkSidePost, {styles});

declare global {
  interface ComponentTypes {
    ThinkSidePost: typeof ThinkSidePostComponent
  }
}
