import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';

/**
 * ReplyCommentDialog: A floating comment editor created by clicking the comment
 * button on a selected-text toolbar (see CommentOnSelectionPageWrapper).
 *
 * post: The post that's being commented on.
 * initialHtml: Text to prefill the comment editor. In practice, a blockquote of
 *   the selected content.
 * onClose: Called when the close button is clicked on the floating editor.
 */
const ReplyCommentDialogInner = ({post, initialHtml, onClose}: {
  post: PostsList,
  initialHtml: string,
  parentComment?: CommentsList,
  onClose: () => void,
}) => {
  const { PopupCommentEditor } = Components;
  
  return <PopupCommentEditor
    title={"New Comment: " + post.title}
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

export const ReplyCommentDialog = registerComponent('ReplyCommentDialog', ReplyCommentDialogInner);

declare global {
  interface ComponentTypes {
    ReplyCommentDialog: typeof ReplyCommentDialog
  }
}
