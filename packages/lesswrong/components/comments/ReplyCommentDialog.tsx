import React from 'react';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { Link } from '../../lib/reactRouterWrapper';

const styles = (theme: ThemeType): JssStyles => ({
  popup: {
    position: "fixed",
    background: theme.palette.panelBackground.default,
    border: theme.palette.border.normal,
    boxShadow: theme.palette.boxShadow.default,
    bottom: 0,
    right: 20,
    width: 500,
    height: 400,
  },
  heading: {
    background: theme.palette.primary.dark,
    padding: 8,
  },
  title: {
    ...theme.typography.commentStyle,
    color: theme.palette.text.invertedBackgroundText,
    fontSize: "1.2rem"
  },
  closeButton: {
    position: "absolute",
    top: 4,
    right: 4,
    color: theme.palette.text.invertedBackgroundText,
    cursor: "pointer",
  },
  form: {
    padding: 8,
  },
})


const ReplyCommentDialog = ({post, initialText, onClose, classes}: {
  post: PostsBase,
  initialText: string, //TODO
  onClose?: ()=>void,
  classes: ClassesType,
}) => {
  const { CommentsNewForm, Typography, LWDialog } = Components;
  
  const closeDialog = () => {
    onClose?.();
  }

  return (
    <div className={classes.popup}>
      <div className={classes.heading}>
        <div className={classes.title}>{post.title}</div>
        <div className={classes.closeButton} onClick={closeDialog}>X</div>
      </div>
      <div className={classes.form}>
        <CommentsNewForm
          post={post}
          padding={false}
          successCallback={onClose}
          enableGuidelines={false}
          type="comment"
        />
      </div>
    </div>
  );
}

const ReplyCommentDialogComponent = registerComponent('ReplyCommentDialog', ReplyCommentDialog, {styles});

declare global {
  interface ComponentTypes {
    ReplyCommentDialog: typeof ReplyCommentDialogComponent
  }
}

