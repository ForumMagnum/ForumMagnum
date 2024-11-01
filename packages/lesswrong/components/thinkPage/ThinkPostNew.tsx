// TODO: Import component in components.ts
import React from 'react';
import { registerComponent, Components, fragmentTextForQuery } from '../../lib/vulcan-lib';
import { useTracking } from "../../lib/analyticsEvents";

const styles = (theme: ThemeType) => ({
  root: {

  }
});

export const ThinkPostNew = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  const { captureEvent } = useTracking(); //it is virtuous to add analytics tracking to new components

  const { PostsNewForm, ThinkWrapper } = Components;

  return <ThinkWrapper>
    <PostsNewForm showTableOfContents={false} />
  </ThinkWrapper>
}

const ThinkPostNewComponent = registerComponent('ThinkPostNew', ThinkPostNew, {styles});

declare global {
  interface ComponentTypes {
    ThinkPostNew: typeof ThinkPostNewComponent
  }
}
