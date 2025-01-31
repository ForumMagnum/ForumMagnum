import React from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { useTracking } from "../../lib/analyticsEvents";
import { ThinkSideChapter } from './ThinkSideChapter';
import { sectionStyles } from './ThinkSidePost';
  
const styles = (theme: ThemeType) => ({
  root: {
    ...sectionStyles(theme),
  }
});

export const ThinkSideSequence = ({classes, sequence  }: {
  classes: ClassesType<typeof styles>,
  sequence: SequencesPageWithChaptersFragment
}) => {
  console.log('sequence', sequence);
  
  return <div className={classes.root}>
    <h3>{sequence.title}</h3>
    {sequence.chapters.map((chapter) => <div key={chapter._id}>
      <h4>{chapter.title}</h4>
      {chapter.posts.map((post) => <div key={post._id}>
        <p>{post.title}</p>
      </div>)}
    </div>)}
  </div>;
}

const ThinkSideSequenceComponent = registerComponent('ThinkSideSequence', ThinkSideSequence, {styles});

declare global {
  interface ComponentTypes {
    ThinkSideSequence: typeof ThinkSideSequenceComponent
  }
}
