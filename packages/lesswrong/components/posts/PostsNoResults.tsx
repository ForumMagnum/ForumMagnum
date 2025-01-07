import { registerComponent, Components } from '../../lib/vulcan-lib';
import React from 'react';

const styles = (theme: ThemeType) => ({
  root: {
    marginLeft: theme.spacing.unit,
    color: theme.palette.text.dim4,
    ...theme.typography.italic,
  }
});

const PostsNoResults = ({classes}: {
  classes: ClassesType<typeof styles>,
}) =>
  <Components.Typography variant="body2" className={classes.root}>
    No posts to display.
  </Components.Typography>;

const PostsNoResultsComponent = registerComponent('PostsNoResults', PostsNoResults, {styles});

declare global {
  interface ComponentTypes {
    PostsNoResults: typeof PostsNoResultsComponent
  }
}

