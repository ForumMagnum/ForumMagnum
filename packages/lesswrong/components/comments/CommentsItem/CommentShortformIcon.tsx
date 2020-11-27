import { registerComponent, Components } from '../../../lib/vulcan-lib';
import React from 'react';
import NotesIcon from '@material-ui/icons/Notes';
import { commentGetPageUrlFromIds } from "../../../lib/collections/comments/helpers";
import { Link } from '../../../lib/reactRouterWrapper';

const styles = (theme: ThemeType): JssStyles => ({
  icon: {
    cursor: "pointer",
    color: theme.palette.grey[600],
    width: 13,
    height: 13,
    marginLeft: -2,
    marginRight: theme.spacing.unit,
    position: "relative",
    top: 2
  }
});

const CommentShortformIcon = ({comment, post, classes, simple}: {
  comment: CommentsList,
  post: PostsMinimumInfo,
  classes: ClassesType,
  simple?: boolean,
}) => {

  const { LWTooltip } = Components
  // Top level shortform posts should show this icon/button, both to make shortform posts a bit more visually distinct, and to make it easier to grab permalinks for shortform posts.
  if (!comment.shortform || comment.topLevelCommentId) return null

  if (simple) return <NotesIcon className={classes.icon} />

  return (
    <LWTooltip title="Shortform">
      <Link to={commentGetPageUrlFromIds({postId:post._id, postSlug:post.slug, commentId: comment._id})}>
        <NotesIcon className={classes.icon} />
      </Link>
    </LWTooltip>
  )
}

const CommentShortformIconComponent = registerComponent(
  'CommentShortformIcon', CommentShortformIcon, {styles}
);

declare global {
  interface ComponentTypes {
    CommentShortformIcon: typeof CommentShortformIconComponent,
  }
}

