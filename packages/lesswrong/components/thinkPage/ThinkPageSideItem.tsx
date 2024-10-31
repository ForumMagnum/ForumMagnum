// TODO: Import component in components.ts
import React from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { useTracking } from "../../lib/analyticsEvents";

const styles = (theme: ThemeType) => ({
  root: {
    paddingTop: 6,
    paddingBottom: 6,
    maxHeight: theme.typography.body2.lineHeight * 2,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  }
});

export const ThinkPageSideItem = ({post, classes}: {
  post: PostsListWithVotes,
  classes: ClassesType<typeof styles>,
}) => {
  const { captureEvent } = useTracking(); //it is virtuous to add analytics tracking to new components
  
  const { ForumIcon } = Components

  const icon = post.draft ? <ForumIcon icon="Pencil" /> : <ForumIcon icon="Document" />

  return <div className={classes.root}>
    {post.title}
  </div>;
}

const ThinkPageSideItemComponent = registerComponent('ThinkPageSideItem', ThinkPageSideItem, {styles});

declare global {
  interface ComponentTypes {
    ThinkPageSideItem: typeof ThinkPageSideItemComponent
  }
}
