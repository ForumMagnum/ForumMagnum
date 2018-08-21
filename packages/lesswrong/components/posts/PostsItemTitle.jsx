import { Components, registerComponent } from 'meteor/vulcan:core';
import React from 'react';
import Typography from '@material-ui/core/Typography';
import { withStyles } from '@material-ui/core/styles'
import grey from '@material-ui/core/colors/grey';

const styles = theme => ({
  root: {
    whiteSpace:"nowrap",
    overflow:"hidden",
    textOverflow:"ellipsis",
    width:"calc(100% - 80px)",
    [theme.breakpoints.down('xs')]: {
      paddingLeft: 2,
    },
    '&:hover': {
      color:grey[500]
    }
  }
})

const PostsItemTitle = ({post, classes}) => {

  return (
    <Typography variant="title" className={classes.root}>
      {post.url && "[Link]"}{post.unlisted && "[Unlisted]"}{post.isEvent && "[Event]"} {post.title}
    </Typography>
  )
}

PostsItemTitle.displayName = "PostsItemTitle";

registerComponent('PostsItemTitle', PostsItemTitle, withStyles(styles));
