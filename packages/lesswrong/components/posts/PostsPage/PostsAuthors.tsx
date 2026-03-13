import React from 'react'
import UserNameDeleted from "../../users/UserNameDeleted";
import UsersName from "../../users/UsersName";
import UserCommentMarkers from "../../users/UserCommentMarkers";
import PostsCoauthor from "./PostsCoauthor";
import { AUTHOR_MARKER_STYLES } from "./authorMarkerStyles";
import { Typography } from "../../common/Typography";
import { defineStyles } from '@/components/hooks/defineStyles';
import { useStyles } from '@/components/hooks/useStyles';

const styles = defineStyles('PostsAuthors', (theme: ThemeType) => ({
  root: {
    fontFamily: theme.isFriendlyUI ? theme.typography.uiSecondary.fontFamily : undefined,
    textAlign: 'left',
    display: 'inline',
  },
  authorName: {
    fontWeight: 600,
    marginLeft: theme.isFriendlyUI ? 1 : 0,
  },
  authorMarkers: AUTHOR_MARKER_STYLES,
}))

const PostsAuthors = ({post, pageSectionContext}: {
  post: PostsList,
  pageSectionContext?: string,
}) => {
  const classes = useStyles(styles);

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
        <PostsCoauthor key={coauthor._id} coauthor={coauthor} pageSectionContext={pageSectionContext} />
      )}
    </span>
  </Typography>
}

export default PostsAuthors;


