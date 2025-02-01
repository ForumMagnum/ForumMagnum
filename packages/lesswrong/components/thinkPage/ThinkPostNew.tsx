// TODO: Import component in components.ts
import React from 'react';
import { registerComponent, Components, fragmentTextForQuery } from '../../lib/vulcan-lib';
import { useTracking } from "../../lib/analyticsEvents";
import { postFormSectionStyles } from './ThinkWrapper';

const styles = (theme: ThemeType) => ({
  formContainer: {
    maxWidth: 715,
    width: '100%',
    ...postFormSectionStyles(theme),
    marginLeft: "auto",
    marginRight: "auto",
  }
});

export const ThinkPostNew = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  const { captureEvent } = useTracking(); //it is virtuous to add analytics tracking to new components

  const { PostsNewForm, ThinkWrapper } = Components;

  return <ThinkWrapper>
    <div className={classes.formContainer}> 
      <PostsNewForm showTableOfContents={false} fields={['title', 'contents']} />
    </div>
  </ThinkWrapper>
}

const ThinkPostNewComponent = registerComponent('ThinkPostNew', ThinkPostNew, {styles});

declare global {
  interface ComponentTypes {
    ThinkPostNew: typeof ThinkPostNewComponent
  }
}
