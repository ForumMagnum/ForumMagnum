import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';

const styles = (theme: ThemeType): JssStyles => ({
});

const ReplyCommentDialog = ({post, initialHtml, onClose, classes}: {
  post: PostsList,
  initialHtml: string,
  onClose: ()=>void,
  classes: ClassesType,
}) => {
  const { PopupCommentEditor } = Components;
  
  return <PopupCommentEditor
    title={post.title}
    onClose={onClose}
    commentFormProps={{
      post: post,
      prefilledProps: {
        contents: {
          originalContents: {
            type: "ckEditorMarkup",
            data: initialHtml,
          }
        },
      },
    }}
  />
}

const ReplyCommentDialogComponent = registerComponent('ReplyCommentDialog', ReplyCommentDialog, {styles});

declare global {
  interface ComponentTypes {
    ReplyCommentDialog: typeof ReplyCommentDialogComponent
  }
}
