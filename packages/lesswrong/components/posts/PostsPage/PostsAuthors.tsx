import React from 'react'
import UserNameDeleted from "../../users/UserNameDeleted";
import UsersName from "../../users/UsersName";
import UserCommentMarkers from "../../users/UserCommentMarkers";
import PostsCoauthor from "./PostsCoauthor";
import { AUTHOR_MARKER_STYLES } from "./authorMarkerStyles";
import { Typography } from "../../common/Typography";
import { defineStyles } from '@/components/hooks/defineStyles';
import { useStyles } from '@/components/hooks/useStyles';
import { useCurrentUserId } from '@/components/common/withUser';
import { currentUserCanSeeDraftAuthorNames } from '../usePostsUserAndCoauthors';

const styles = defineStyles('PostsAuthors', (theme: ThemeType) => ({
  root: {
    fontSize: 'inherit',
    textAlign: 'left',
    display: 'inline',
  },
  authorName: {
    fontWeight: 600,
    marginLeft: 0,
  },
  authorMarkers: AUTHOR_MARKER_STYLES,
}))

const PostsAuthors = ({post, pageSectionContext}: {
  post: PostsList,
  pageSectionContext?: string,
}) => {
  const classes = useStyles(styles);
  const currentUserId = useCurrentUserId();
  const disableNoKibitz = currentUserCanSeeDraftAuthorNames(currentUserId, post);

  return <Typography variant="body1" component="span" className={classes.root}>
    by <span className={classes.authorName}>
      {!post.user || post.hideAuthor
        ? <UserNameDeleted/>
        : <>
          <UsersName user={post.user} pageSectionContext={pageSectionContext} disableNoKibitz={disableNoKibitz} />
          <UserCommentMarkers user={post.user} className={classes.authorMarkers} />
        </>
      }
      {post.coauthors?.map(coauthor =>
        <PostsCoauthor key={coauthor._id} coauthor={coauthor} pageSectionContext={pageSectionContext} disableNoKibitz={disableNoKibitz} />
      )}
    </span>
  </Typography>
}

export default PostsAuthors;


