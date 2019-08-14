import { registerComponent } from 'meteor/vulcan:core';
import React from 'react';
import { withStyles } from '@material-ui/core/styles';
import NotesIcon from '@material-ui/icons/notes';
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

const CommentShortformIcon = ({comment, post, postPage, classes}) => {
  if (!comment.shortform || comment.topLevelCommentId || postPage) return null
  return (
    <Tooltip title="Shortform Permalink">
      <Link to={Comments.getPageUrlFromIds(post._id, post.slug, comment._id)}>
        <NotesIcon className={classes.icon} />
      </Link>
    </Tooltip>
  )
}

registerComponent('CommentShortformIcon', CommentShortformIcon,
  withStyles(styles, {name: "CommentShortformIcon"}));