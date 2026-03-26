import React from 'react';
import { Typography } from "../common/Typography";
import { defineStyles } from '@/components/hooks/defineStyles';
import { useStyles } from '@/components/hooks/useStyles';

const styles = defineStyles('PostsNoResults', (theme: ThemeType) => ({
  root: {
    marginLeft: 8,
    color: theme.palette.text.dim4,
    ...theme.typography.italic,
  }
}));

const PostsNoResults = () => {
  const classes = useStyles(styles);
  return <Typography variant="body2" className={classes.root}>
    No posts to display.
  </Typography>;
};

export default PostsNoResults;



