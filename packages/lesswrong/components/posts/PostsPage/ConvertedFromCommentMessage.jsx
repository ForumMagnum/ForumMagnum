import React from 'react';
import { registerComponent } from 'meteor/vulcan:core';
import { withStyles } from '@material-ui/core/styles'
import { Link } from '../../../lib/reactRouterWrapper.js';
import { Comments } from '../../../lib/collections/comments';
import { styles as messageStyles } from '../AlignmentCrosspostMessage';

const styles = theme => ({
  root: {
    ...messageStyles(theme).root
  },
  link: {
    color: theme.palette.primary.main
  }
});

const ConvertedFromCommentMessage = ({post, classes }) => {

  if (!post.convertedFromCommentId) return null

  return (
    <div className={classes.root}>
      This post was originally a comment, <Link to={Comments.getPageUrlFromIds({
        postId: post.convertedFromComment.post._id, 
        postSlug: post.convertedFromComment.post.slug, 
        commentId: post.convertedFromCommentId,
        permalink: false})}>accessible here</Link>
    </div>
  );
}

registerComponent('ConvertedFromCommentMessage', ConvertedFromCommentMessage,
  withStyles(styles, {name: "ConvertedFromCommentMessage"}));
