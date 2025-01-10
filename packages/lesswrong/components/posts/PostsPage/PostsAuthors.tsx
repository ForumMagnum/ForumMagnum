import React from 'react'
import { registerComponent, Components } from '../../../lib/vulcan-lib';
import { isFriendlyUI } from '../../../themes/forumTheme';

export const AUTHOR_MARKER_STYLES = {
  display: "inline-block",
  marginLeft: 3,
  marginRight: -3,
};

const styles = (theme: ThemeType) => ({
  root: {
    fontFamily: isFriendlyUI ? theme.typography.uiSecondary.fontFamily : undefined,
    textAlign: 'left',
    display: 'inline',
  },
  authorName: {
    fontWeight: 600,
    marginLeft: isFriendlyUI ? 1 : 0,
  },
  authorMarkers: AUTHOR_MARKER_STYLES,
})

const PostsAuthors = ({classes, post, pageSectionContext}: {
  classes: ClassesType<typeof styles>,
  post: PostsList,
  pageSectionContext?: string,
}) => {
  const { UsersName, UserCommentMarkers, PostsCoauthor, Typography } = Components
  return <Typography variant="body1" component="span" className={classes.root}>
    by <span className={classes.authorName}>
      {!post.user || post.hideAuthor
        ? <Components.UserNameDeleted/>
        : <>
          <UsersName user={post.user} pageSectionContext={pageSectionContext} />
          <UserCommentMarkers user={post.user} className={classes.authorMarkers} />
        </>
      }
      {post.coauthors?.map(coauthor =>
        <PostsCoauthor key={coauthor._id} post={post} coauthor={coauthor} pageSectionContext={pageSectionContext} />
      )}
    </span>
  </Typography>
}

const PostsAuthorsComponent = registerComponent('PostsAuthors', PostsAuthors, {styles});

declare global {
  interface ComponentTypes {
    PostsAuthors: typeof PostsAuthorsComponent
  }
}
