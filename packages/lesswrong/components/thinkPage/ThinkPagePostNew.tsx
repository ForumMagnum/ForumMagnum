// TODO: Import component in components.ts
import React from 'react';
import { registerComponent, Components, fragmentTextForQuery } from '../../lib/vulcan-lib';
import { useTracking } from "../../lib/analyticsEvents";

const styles = (theme: ThemeType) => ({
  root: {

  }
});

export const ThinkPagePostNew = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  const { captureEvent } = useTracking(); //it is virtuous to add analytics tracking to new components

  const { PostsNewForm, ThinkPageWrapper } = Components;

  return <ThinkPageWrapper>
    <PostsNewForm showTableOfContents={false} />
  </ThinkPageWrapper>
}

const ThinkPagePostNewComponent = registerComponent('ThinkPagePostNew', ThinkPagePostNew, {styles});

declare global {
  interface ComponentTypes {
    ThinkPagePostNew: typeof ThinkPagePostNewComponent
  }
}
