import { registerComponent, getSetting } from 'meteor/vulcan:core';
import React from 'react';
import PropTypes from 'prop-types';

const styles = theme => ({
  root: {
    ...theme.typography.contentNotice,
    ...theme.typography.postStyle
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

const AlignmentCrosspostMessageComponent = registerComponent('AlignmentCrosspostMessage', AlignmentCrosspostMessage, {styles});

declare global {
  interface ComponentTypes {
    AlignmentCrosspostMessage: typeof AlignmentCrosspostMessageComponent
  }
}