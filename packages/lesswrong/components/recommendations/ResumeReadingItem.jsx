import React from 'react';
import { registerComponent } from 'meteor/vulcan:core';
import { withStyles } from '@material-ui/core/styles';

const styles = theme => ({
});

const ResumeReadingItem = ({sequence, lastReadPost, nextPost, currentUser, classes}) => {
  return <div>
    <div>Resume reading sequence: {sequence.title}</div>
    <div>Last read post: {lastReadPost.title}</div>
    <div>Next post: {nextPost.title}</div>
  </div>;
}

registerComponent('ResumeReadingItem', ResumeReadingItem,
  withStyles(styles, {name: "ResumeReadingItem"}));