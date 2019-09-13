import { registerComponent } from 'meteor/vulcan:core';
import React from 'react';
import { withStyles } from '@material-ui/core/styles';
import NotesIcon from '@material-ui/icons/Notes';
import Tooltip from '@material-ui/core/Tooltip';
import { Comments } from "../../../lib/collections/comments";
import { Link } from '../../../lib/reactRouterWrapper.js';

const styles = theme => ({
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

const CommentShortformIcon = ({comment, post, classes, simple}) => {
  // Top level shortform posts should show this icon/button, both to make shortform posts a bit more visually distinct, and to make it easier to grab permalinks for shortform posts.
  if (!comment.shortform || comment.topLevelCommentId) return null

  if (simple) return <NotesIcon className={classes.icon} />

  return (
    <Tooltip title="Shortform Permalink">
      <Link to={Comments.getPageUrlFromIds({postId:post._id, postSlug:post.slug, commentId: comment._id})}>
        <NotesIcon className={classes.icon} />
      </Link>
    </Tooltip>
  )
}

registerComponent('CommentShortformIcon', CommentShortformIcon,
  withStyles(styles, {name: "CommentShortformIcon"}));
