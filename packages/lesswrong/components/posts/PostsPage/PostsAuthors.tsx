import React from 'react'
import { registerComponent, Components } from '../../../lib/vulcan-lib';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    fontFamily: theme.typography.uiSecondary.fontFamily,
    textAlign: 'left',
    display: 'inline',
  },
  authorName: {
    fontWeight: 600,
  },
})

const PostsAuthors = ({classes, post}: {
  classes: ClassesType,
  post: PostsDetails,
}) => {
  const { UsersName, Typography } = Components
  return <Typography variant="body1" component="span" className={classes.root}>
    by <span className={classes.authorName}>
      {!post.user || post.hideAuthor ? <Components.UserNameDeleted/> : <UsersName user={post.user} />}
      { post.coauthors?.map(coauthor=><span key={coauthor._id} >
        , <UsersName user={coauthor} />
      </span>)}
    </span>
  </Typography>
}

const PostsAuthorsComponent = registerComponent('PostsAuthors', PostsAuthors, {styles});

declare global {
  interface ComponentTypes {
    PostsAuthors: typeof PostsAuthorsComponent
  }
}
