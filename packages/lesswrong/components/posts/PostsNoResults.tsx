import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import React from 'react';

const styles = (theme: ThemeType) => ({
  root: {
    marginLeft: theme.spacing.unit,
    color: theme.palette.text.dim4,
    ...theme.typography.italic,
  }
});

const PostsNoResultsInner = ({classes}: {
  classes: ClassesType<typeof styles>,
}) =>
  <Components.Typography variant="body2" className={classes.root}>
    No posts to display.
  </Components.Typography>;

export const PostsNoResults = registerComponent('PostsNoResults', PostsNoResultsInner, {styles});

declare global {
  interface ComponentTypes {
    PostsNoResults: typeof PostsNoResults
  }
}

