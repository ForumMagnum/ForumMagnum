import React from 'react';
import { registerComponent } from 'meteor/vulcan:core';
import { useCommentBox } from '../common/withCommentBox';
import { useDialog } from '../common/withDialog';
import withUser from '../common/withUser';
import { withStyles } from '@material-ui/core/styles';

const styles = theme => ({
  root: {
    ...theme.typography.body2,
    ...theme.typography.commentStyle,
    fontSize: "1rem",
    color: theme.palette.lwTertiary.main,
    marginLeft: theme.spacing.unit,
    marginRight: theme.spacing.unit*1.5,
    '&:hover': {
      opacity: .5
    }
  }
})

const ReviewPostButton = ({classes, post, currentUser, reviewMessage="Review"}) => {
  const { openCommentBox } = useCommentBox();
  const { openDialog } = useDialog();

  const handleClick = () => {
    if (currentUser) {
      openCommentBox({
        componentName: "ReviewPostForm",
        componentProps: {
          post: post
        }
      });
    } else {
      openDialog({
        componentName: "LoginPopup",
        componentProps: {}
      });
    }
  }

  if (post.nominationCount2018 < 2) return null

  return (
    <span onClick={handleClick} className={classes.root}>
      {reviewMessage}
    </span>
  )
}

registerComponent('ReviewPostButton', ReviewPostButton, withUser, withStyles(styles, {name:"ReviewPostButton"}));
