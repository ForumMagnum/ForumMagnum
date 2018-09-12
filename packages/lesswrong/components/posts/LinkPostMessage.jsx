import { Components, registerComponent } from 'meteor/vulcan:core';
import { Posts } from 'meteor/example-forum';
import React from 'react';
import { withStyles } from '@material-ui/core/styles';
import { Link } from 'react-router';
import grey from '@material-ui/core/colors/grey';

const styles = theme => ({
  root: {
    color: grey[600],
    marginBottom: theme.spacing.unit*2,
    ...theme.typography.postStyle,
    fontSize:".9em",
    '& > a': {
      color: theme.palette.secondary.light
    }
  },
})

const LinkPostMessage = ({post, classes}) => {
  if (post) {
    return <div className={classes.root}>
        { post.url && <span>This is a linkpost for <Link to={Posts.getLink(post)} target={Posts.getLinkTarget(post)}>{post.url}</Link></span>}
      </div>
  } else {
    return null
  }
};

LinkPostMessage.displayName = "LinkPostMessage";

registerComponent('LinkPostMessage', LinkPostMessage, withStyles(styles, {name:"LinkPostMessage"}));
