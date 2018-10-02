import { Components, registerComponent } from 'meteor/vulcan:core';
import { Posts } from '../../lib/collections/posts';
import React from 'react';
import { withStyles } from '@material-ui/core/styles';
import { Link } from 'react-router';
import grey from '@material-ui/core/colors/grey';
import PropTypes from 'prop-types';

const styles = theme => ({
  root: {
    color: grey[600],
    marginBottom: theme.spacing.unit*2,
    fontSize:".9em",
    ...theme.typography.postStyle,
  },
})

const LinkPostMessage = ({post, classes}) => {
  return <div className={classes.root}>
          { post.url && <span>This is a linkpost for <Link to={Posts.getLink(post)} target={Posts.getLinkTarget(post)}>{post.url}</Link></span>}
        </div>
}

LinkPostMessage.displayName = "LinkPostMessage";

LinkPostMessage.propTypes = {
  post: PropTypes.object.isRequired,
  classes: PropTypes.object.isRequired
};

registerComponent('LinkPostMessage', LinkPostMessage, withStyles(styles, {name:"LinkPostMessage"}));
