import React from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { useTracking } from "../../lib/analyticsEvents";
import { ThinkSideChapter } from './ThinkSideChapter';
import { sectionStyles } from './ThinkSidePost';
  
const styles = (theme: ThemeType) => ({
  root: {
    padding: theme.spacing.unit * 2,
    marginBottom: theme.spacing.unit,
    borderRadius: 3,
    marginTop: theme.spacing.unit * 1.5,
    marginLeft: -6,
    background: theme.palette.background.primaryTranslucent
  },
  section: {
    marginLeft: theme.spacing.unit * 1.5,
    ...sectionStyles(theme),
  },
  title: {
    ...sectionStyles(theme),
  },
});

export const ThinkSideSequence = ({classes, sequence  }: {
  classes: ClassesType<typeof styles>,
  sequence: SequencesPageWithChaptersFragment
}) => {
  
  return <div className={classes.root}>
    <h3 className={classes.title}>{sequence.title}</h3>
    {sequence.chapters.map((chapter) => <div key={chapter._id}>
      <h4>{chapter.title}</h4>
      {chapter.posts.map((post) => <div key={post._id} className={classes.section}>
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
