import { registerComponent } from 'meteor/vulcan:core';
import { Posts } from '../../lib/collections/posts';
import React from 'react';
import { withStyles, createStyles } from '@material-ui/core/styles';
import PropTypes from 'prop-types';

const styles = createStyles(theme => ({
  root: {
    ...theme.typography.contentNotice,
    ...theme.typography.postStyle
  },
}))

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

const LinkPostMessageComponent = registerComponent('LinkPostMessage', LinkPostMessage, withStyles(styles, {name:"LinkPostMessage"}));

declare global {
  interface ComponentTypes {
    LinkPostMessage: typeof LinkPostMessageComponent
  }
}

