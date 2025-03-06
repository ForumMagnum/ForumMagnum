import React from 'react'
import { Components, registerComponent } from '../../../lib/vulcan-lib/components';
import { isFriendlyUI } from '../../../themes/forumTheme';
import UsersName from "@/components/users/UsersName";
import UserCommentMarkers from "@/components/users/UserCommentMarkers";
import PostsCoauthor from "@/components/posts/PostsPage/PostsCoauthor";
import { Typography } from "@/components/common/Typography";
import UserNameDeleted from "@/components/users/UserNameDeleted";

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
  return <Typography variant="body1" component="span" className={classes.root}>
    by <span className={classes.authorName}>
      {!post.user || post.hideAuthor
        ? <UserNameDeleted/>
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

export default PostsAuthorsComponent;
