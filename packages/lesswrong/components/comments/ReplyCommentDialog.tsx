import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';

const styles = (theme: ThemeType): JssStyles => ({
});

const ReplyCommentDialog = ({post, initialText, onClose, classes}: {
  post: PostsList,
  initialText: string, //TODO
  onClose: ()=>void,
  classes: ClassesType,
}) => {
  const { PopupCommentEditor } = Components;
  
  return <PopupCommentEditor
    title={post.title}
    onClose={onClose}
    commentFormProps={{
      post: post,
    }}
  />
}

const ReplyCommentDialogComponent = registerComponent('ReplyCommentDialog', ReplyCommentDialog, {styles});

declare global {
  interface ComponentTypes {
    ReplyCommentDialog: typeof ReplyCommentDialogComponent
  }
}
