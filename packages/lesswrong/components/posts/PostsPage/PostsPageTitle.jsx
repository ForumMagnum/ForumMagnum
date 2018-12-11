import React from 'react'
import { withStyles } from '@material-ui/core/styles';
import { registerComponent } from 'meteor/vulcan:core';
import Typography from '@material-ui/core/Typography';
import { Link } from 'react-router'

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
  },
  question: {
    color: theme.palette.grey[600],
    display: "block",
    marginTop: "1em"
  }
})

const PostsPageTitle = ({classes, post}) => <div>
  {post.question && <Typography variant="title">
    <Link to="/questions" className={classes.question}>
      [ Question ]
    </Link>
  </Typography>}
  <Typography variant="display3" className={classes.root}>
    {post.draft && <span className={classes.draft}>[Draft] </span>}
    {post.title}
  </Typography>
</div>


registerComponent('PostsPageTitle', PostsPageTitle, withStyles(styles, {name: "PostsPageTitle"}))
