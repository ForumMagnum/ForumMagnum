import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib';

const styles = (theme: ThemeType): JssStyles => ({
  root: {

  }
});

export const ReviewVotingProgressBar = ({classes}: {
  classes: ClassesType,
}) => {
  return <div className={classes.root}>

  </div>;
}

const ReviewVotingProgressBarComponent = registerComponent('ReviewVotingProgressBar', ReviewVotingProgressBar, {styles});

declare global {
  interface ComponentTypes {
    ReviewVotingProgressBar: typeof ReviewVotingProgressBarComponent
  }
}

