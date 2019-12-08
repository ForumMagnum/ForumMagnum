import { registerComponent } from 'meteor/vulcan:core';
import { Posts } from '../../lib/collections/posts';
import React from 'react';
import { withStyles } from '@material-ui/core/styles';
import PropTypes from 'prop-types';

const styles = theme => ({
  root: {
    ...theme.typography.contentNotice,
    ...theme.typography.postStyle
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
