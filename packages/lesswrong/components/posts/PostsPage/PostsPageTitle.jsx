import React from 'react'
import { withStyles } from '@material-ui/core/styles';
import { registerComponent } from 'meteor/vulcan:core';
import Typography from '@material-ui/core/Typography';
import { Link } from 'react-router-dom';
import { Posts } from '../../../lib/collections/posts';

const styles = theme => ({
  root: {
    ...theme.typography.h2,
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

const PostsPageTitle = ({classes, post}) => {
  const parentPost = _.filter(post.sourcePostRelations, rel => !!rel.sourcePost)?.[0]?.sourcePost

  
  return (
    <div>
      {post.question && !parentPost && <Typography variant="h6">
        <Link to="/questions" className={classes.question}>
          [ Question ] 
        </Link>
      </Typography>}
      {post.question && parentPost && <Typography variant="h6">
        <Link to={Posts.getPageUrl(parentPost)} className={classes.question}>
          [ Parent Question — {parentPost.title} ]
        </Link>
      </Typography>}
      <Typography variant="h2" className={classes.root}>
        {post.draft && <span className={classes.draft}>[Draft] </span>}
        {post.title}
      </Typography>
    </div>
  )
}


registerComponent('PostsPageTitle', PostsPageTitle, withStyles(styles, {name: "PostsPageTitle"}))
