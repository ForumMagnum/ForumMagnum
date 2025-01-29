import React from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { useTracking } from "../../lib/analyticsEvents";
import { ThinkSideChapter } from './ThinkSideChapter';

const styles = (theme: ThemeType) => ({
  root: {

  }
});

export const ThinkSideSequence = ({classes, sequence  }: {
  classes: ClassesType<typeof styles>,
  sequence: SequencesPageWithChaptersFragment
}) => {
  
  return <div className={classes.root}>
    <h3>{sequence.title}</h3>
    {sequence.chapters.map((chapter) => <h4 key={chapter._id}>{chapter.title}</h4>)}
  </div>;
}

const ThinkSideSequenceComponent = registerComponent('ThinkSideSequence', ThinkSideSequence, {styles});

declare global {
  interface ComponentTypes {
    ThinkSideSequence: typeof ThinkSideSequenceComponent
  }
}
