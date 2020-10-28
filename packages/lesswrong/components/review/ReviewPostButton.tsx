import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib';
import { useCommentBox } from '../common/withCommentBox';
import { useDialog } from '../common/withDialog';
import { useCurrentUser } from '../common/withUser';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    ...theme.typography.body2,
    ...theme.typography.commentStyle,
    fontSize: "1rem",
    color: theme.palette.lwTertiary.main,
    marginLeft: theme.spacing.unit,
    marginRight: theme.spacing.unit*1.5,
    cursor: "pointer",
    '&:hover': {
      opacity: .8
    }
  }
})

const ReviewPostButton = ({classes, post, reviewMessage="Review"}: {
  classes: ClassesType,
  post: PostsBase,
  reviewMessage: any,
}) => {
  const currentUser = useCurrentUser();
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

const ReviewPostButtonComponent = registerComponent('ReviewPostButton', ReviewPostButton, {styles});

declare global {
  interface ComponentTypes {
    ReviewPostButton: typeof ReviewPostButtonComponent
  }
}

