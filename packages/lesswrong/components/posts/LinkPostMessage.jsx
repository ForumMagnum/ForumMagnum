import { registerComponent } from 'meteor/vulcan:core';
import { Posts } from '../../lib/collections/posts';
import React from 'react';
import { withStyles } from '@material-ui/core/styles';
import grey from '@material-ui/core/colors/grey';
import PropTypes from 'prop-types';

const styles = theme => ({
  root: {
    color: grey[600],
    marginBottom: theme.spacing.unit*2,
    fontSize:".9em",
    maxWidth: "100%",
    overflowX: "hidden",
    textOverflow: "ellipsis",
    ...theme.typography.postStyle,
  },
})

const LinkPostMessage = ({post, classes}) => {
  if (!post.url)
    return null;

  return (
    <div className={classes.root}>
      This is a linkpost for <a href={Posts.getLink(post)} target={Posts.getLinkTarget(post)}>{post.url}</a>
    </div>
  );
}

LinkPostMessage.propTypes = {
  post: PropTypes.object.isRequired,
  classes: PropTypes.object.isRequired
};

registerComponent('LinkPostMessage', LinkPostMessage, withStyles(styles, {name:"LinkPostMessage"}));
