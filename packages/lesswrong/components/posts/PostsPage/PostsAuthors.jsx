import React from 'react'
import { withStyles } from '@material-ui/core/styles';
import { registerComponent, Components } from 'meteor/vulcan:core';
import Typography from '@material-ui/core/Typography';

const styles = theme => ({
  root: {
    textAlign: 'left',
    display: 'inline',
    ...theme.typography.postStyle
  },
  authorName: {
    fontWeight: 600,
  },
})

const PostsAuthors = ({classes, post}) => {
  const { UsersName } = Components
  return <Typography variant="body2" component="span" className={classes.root}>
    by <span className={classes.authorName}>
      {!post.user || post.hideAuthor ? <Components.UserNameDeleted/> : <UsersName user={post.user} />}
      { post.coauthors?.map(coauthor=><span key={coauthor._id} >
        , <UsersName user={coauthor} />
      </span>)}
    </span>
  </Typography>
}

registerComponent('PostsAuthors', PostsAuthors, withStyles(styles, {name: "PostsAuthors"}))
