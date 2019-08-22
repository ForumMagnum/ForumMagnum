import { registerComponent, getSetting } from 'meteor/vulcan:core';
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
    fontStyle: "italic",
    ...theme.typography.postStyle,
  },
})

const AlignmentCrosspostMessage = ({post, classes}) => {
  if (post.af && getSetting('forumType') !== 'AlignmentForum') {
    return (
      <div className={classes.root}>
        Crossposted from the <a href={`https://alignmentforum.org/posts/${post._id}/${post.slug}`}>AI Alignment Forum</a>. May contain more technical jargon than usual.
      </div>
    );
  } else {
    return null
  }
}

AlignmentCrosspostMessage.propTypes = {
  post: PropTypes.object.isRequired,
  classes: PropTypes.object.isRequired
};

registerComponent('AlignmentCrosspostMessage', AlignmentCrosspostMessage, withStyles(styles, {name:"AlignmentCrosspostMessage"}));
