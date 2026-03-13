import { registerComponent } from '../../lib/vulcan-lib/components';
import React from 'react';
import { Typography } from "../common/Typography";
import { defineStyles } from '@/components/hooks/defineStyles';

const styles = defineStyles('PostsNoResults', (theme: ThemeType) => ({
  root: {
    marginLeft: 8,
    color: theme.palette.text.dim4,
    ...theme.typography.italic,
  }
}));

const PostsNoResults = ({classes}: {
  classes: ClassesType<typeof styles>,
}) =>
  <Typography variant="body2" className={classes.root}>
    No posts to display.
  </Typography>;

export default registerComponent('PostsNoResults', PostsNoResults, {styles});



