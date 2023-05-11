import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib';

const styles = (theme: ThemeType): JssStyles => ({
  root: {

  }
});

export const PostRateLimitWarning = ({classes}: {
  classes: ClassesType,
}) => {
  return <div className={classes.root}>

  </div>;
}

const PostRateLimitWarningComponent = registerComponent('PostRateLimitWarning', PostRateLimitWarning, {styles});

declare global {
  interface ComponentTypes {
    PostRateLimitWarning: typeof PostRateLimitWarningComponent
  }
}

