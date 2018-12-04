import React from 'react'
import { withStyles } from '@material-ui/core/styles';
import { registerComponent } from 'meteor/vulcan:core';
import Typography from '@material-ui/core/Typography';

const styles = theme => ({
  root: {
    ...theme.typography.display3,
    ...theme.typography.postStyle,
    ...theme.typography.headerStyle,
    margin: "0 !important",
    color: theme.palette.text.primary,
    [theme.breakpoints.down('sm')]: {
      fontSize: '2.5rem',
    }
  },
  draft: {
    color: theme.palette.grey[500]
  }
})

const PostsPageTitle = ({classes, post}) =>
  <Typography variant="display3" className={classes.root}>
    {post.draft && <span className={classes.draft}>[Draft] </span>}
    {post.question && <span>Question: </span>}
    {post.title}
  </Typography>


registerComponent('PostsPageTitle', PostsPageTitle, withStyles(styles, {name: "PostsPageTitle"}))
