import React from 'react'
import { withStyles } from '@material-ui/core/styles';
import { registerComponent } from 'meteor/vulcan:core';
import Typography from '@material-ui/core/Typography';

const styles = theme => ({
  root: {
    margin: 0,
    ...theme.typography.display3,
    ...theme.typography.postStyle,
    ...theme.typography.headerStyle,
    color: theme.palette.text.primary,
    [theme.breakpoints.down('sm')]: {
      fontSize: '2.5rem',
      marginBottom: 10,
      maxWidth: 'calc(100% - 60px)'
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
