import { Components, registerComponent, getSetting } from 'meteor/vulcan:core';
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
    maxWidth: "100%",
    overflowX: "hidden",
    textOverflow: "ellipsis",
    fontStyle: "italic",
    ...theme.typography.postStyle,
  },
})

const AlignmentCrosspostMessage = ({post, classes}) => {
  if (post.af && !getSetting('AlignmentForum', false)) {
    return (
      <div className={classes.root}>
        Crossposted from the <Link to={`https://alignmentforum.org/posts/${post._id}/${post.slug}`}>AI Alignment Forum</Link>. May contain more technical jargon than usual.
      </div>
    );
  } else {
    return null
  }
}

AlignmentCrosspostMessage.displayName = "LinkPostMessage";

AlignmentCrosspostMessage.propTypes = {
  post: PropTypes.object.isRequired,
  classes: PropTypes.object.isRequired
};

registerComponent('AlignmentCrosspostMessage', AlignmentCrosspostMessage, withStyles(styles, {name:"AlignmentCrosspostMessage"}));
