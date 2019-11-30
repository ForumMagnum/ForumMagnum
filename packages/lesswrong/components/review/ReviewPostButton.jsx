import React from 'react';
import { Components, registerComponent } from 'meteor/vulcan:core';
import { withStyles } from '@material-ui/core/styles';
import { useCommentBox } from '../common/withCommentBox';
import { useDialog } from '../common/withDialog';
import Button from '@material-ui/core/Button';
import withUser from '../common/withUser';
import { userHas2018Reviewing } from '../../lib/betas.js';

const styles = (theme) => ({
  root: {
    textAlign: "center",
    marginBottom: 32
  },
  label: {
    ...theme.typography.postStyle,
    ...theme.typography.contentNotice,
    marginBottom: theme.spacing.unit,
  }
})

const ReviewPostButton = ({classes, post, currentUser}) => {
  const { openCommentBox } = useCommentBox();
  const { openDialog } = useDialog();

  const { HoverPreviewLink } = Components

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
  // if (!userHas2018Reviewing(currentUser)) return null

  return <div className={classes.root}>
    <div className={classes.label}>
      This post has been nominated for the <HoverPreviewLink href="http://lesswrong.com/posts/qXwmMkEBLL59NkvYR/the-lesswrong-2018-review-posts-need-at-least-2-nominations" innerHTML={"2018 Review"}/>
    </div>
    <Button onClick={handleClick} color="primary">
      Write a Review
    </Button>
  </div>
}

registerComponent('ReviewPostButton', ReviewPostButton, withStyles(styles, {name:"ReviewPostButton"}), withUser);
