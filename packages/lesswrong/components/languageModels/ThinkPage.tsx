// TODO: Import component in components.ts
import React from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { useTracking } from "../../lib/analyticsEvents";

const styles = (theme: ThemeType) => ({
  root: {
    display: 'flex',
    gap: theme.spacing.unit * 2,
  }
});

export const ThinkPage = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  const { captureEvent } = useTracking(); //it is virtuous to add analytics tracking to new components

  const { PostsNewForm, LanguageModelChat } = Components;

  return <div className={classes.root}>
      <PostsNewForm  />
      <LanguageModelChat />
  </div>;
}

const ThinkPageComponent = registerComponent('ThinkPage', ThinkPage, {styles});

declare global {
  interface ComponentTypes {
    ThinkPage: typeof ThinkPageComponent
  }
}
