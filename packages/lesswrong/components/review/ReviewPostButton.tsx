import React from 'react';
import { AnalyticsContext } from '../../lib/analyticsEvents';
import { useCommentBox } from '../hooks/useCommentBox';
import { useDialog } from '../common/withDialog';
import { useCurrentUser } from '../common/withUser';
import ReviewPostForm from "./ReviewPostForm";
import LoginPopup from "../users/LoginPopup";
import { defineStyles } from '@/components/hooks/defineStyles';
import { useStyles } from '@/components/hooks/useStyles';

const styles = defineStyles('ReviewPostButton', (theme: ThemeType) => ({
  root: {
    ...theme.typography.body2,
    ...theme.typography.commentStyle,
    fontSize: "1rem",
    color: theme.palette.lwTertiary.main,
    marginLeft: 8,
    marginRight: 12,
    cursor: "pointer",
    '&:hover': {
      opacity: .8
    }
  }
}))

const ReviewPostButton = ({post, reviewMessage="Review", year}: {
  post: PostsBase,
  reviewMessage?: any,
  year: string
}) => {
  const classes = useStyles(styles);
  const currentUser = useCurrentUser();
  const { openCommentBox } = useCommentBox();
  const { openDialog } = useDialog();

  const handleClick = () => {
    if (currentUser) {
      openCommentBox({
        commentBox: ({onClose}) => <ReviewPostForm
          onClose={onClose}
          post={post}
        />
      });
    } else {
      openDialog({
        name: "LoginPopup",
        contents: ({onClose}) => <LoginPopup onClose={onClose} />
      });
    }
  }

  return (
    <AnalyticsContext pageElementContext="reviewPostButton">
      <span onClick={handleClick} className={classes.root}>
        {reviewMessage}
      </span>
    </AnalyticsContext>
  )
}

export default ReviewPostButton;



