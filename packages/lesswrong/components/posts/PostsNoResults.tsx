import { registerComponent } from '../../lib/vulcan-lib/components';
import React from 'react';
import { Typography } from "../common/Typography";

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
  <Typography variant="body2" className={classes.root}>
    No posts to display.
  </Typography>;

export const PostsNoResults = registerComponent('PostsNoResults', PostsNoResultsInner, {styles});

declare global {
  interface ComponentTypes {
    PostsNoResults: typeof PostsNoResults
  }
}

