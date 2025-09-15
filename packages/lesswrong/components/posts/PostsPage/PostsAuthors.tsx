import React from 'react'
import { registerComponent } from '../../../lib/vulcan-lib/components';
import { isFriendlyUI } from '../../../themes/forumTheme';
import UserNameDeleted from "../../users/UserNameDeleted";
import UsersName from "../../users/UsersName";
import UserCommentMarkers from "../../users/UserCommentMarkers";
import PostsCoauthor from "./PostsCoauthor";
import { Typography } from "../../common/Typography";

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

const PostsAuthors = ({classes, post, pageSectionContext, hidePrefix}: {
  classes: ClassesType<typeof styles>,
  post: PostsList,
  pageSectionContext?: string,
  hidePrefix?: boolean,
}) => {
  return <Typography variant="body1" component="span" className={classes.root}>
    {hidePrefix ? '' : 'by '}<span className={classes.authorName}>
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

export default registerComponent('PostsAuthors', PostsAuthors, {styles});


