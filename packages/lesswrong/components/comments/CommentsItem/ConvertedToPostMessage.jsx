import React from 'react';
import { registerComponent } from 'meteor/vulcan:core';
import { withStyles } from '@material-ui/core/styles'
import { Link } from '../../../lib/reactRouterWrapper.js';
import { Posts } from '../../../lib/collections/posts';

const styles = theme => ({
  root: {
    marginTop: theme.spacing.unit*1.5,
    fontStyle: "italic",
  },
  link: {
    color: theme.palette.primary.main
  }
});

const ConvertedToPostMessage = ({comment, classes }) => {

  if (!comment.convertedToPostId || !comment.convertedToPost || comment.convertedToPost.draft) return null

  return (
    <div className={classes.root}>
      This comment has been converted to the post, <Link className={classes.link} to={Posts.getPageUrl(comment.convertedToPost)}>
          { comment.convertedToPost.title }
        </Link>
    </div>
  );
}

registerComponent('ConvertedToPostMessage', ConvertedToPostMessage,
  withStyles(styles, {name: "ConvertedToPostMessage"}));
