// TODO: Import component in components.ts
import React from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { useTracking } from "../../lib/analyticsEvents";

const styles = (theme: ThemeType) => ({
  root: {

  }
});

export const ThinkSideChapter = ({classes, chapter}: {
  classes: ClassesType<typeof styles>,
  chapter: ChaptersFragment 
}) => {
  const { captureEvent } = useTracking(); //it is virtuous to add analytics tracking to new components
  return <div className={classes.root}>

  </div>;
}

const ThinkSideChapterComponent = registerComponent('ThinkSideChapter', ThinkSideChapter, {styles});

declare global {
  interface ComponentTypes {
    ThinkSideChapter: typeof ThinkSideChapterComponent
  }
}
