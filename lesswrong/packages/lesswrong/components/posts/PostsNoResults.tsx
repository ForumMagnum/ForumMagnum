import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import React from 'react';
import { Typography } from "@/components/common/Typography";

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
  <Typography variant="body2" className={classes.root}>
    No posts to display.
  </Typography>;

const PostsNoResultsComponent = registerComponent('PostsNoResults', PostsNoResults, {styles});

declare global {
  interface ComponentTypes {
    PostsNoResults: typeof PostsNoResultsComponent
  }
}

export default PostsNoResultsComponent;

