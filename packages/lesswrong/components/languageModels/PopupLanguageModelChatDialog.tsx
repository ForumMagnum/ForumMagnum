import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';


// TODO: Fix up comment for this copy-pasted component
/**
 * PopupLanguageModelChatDialog: A floating comment editor created by clicking the comment
 * button on a selected-text toolbar (see CommentOnSelectionPageWrapper).
 *
 * post: The post that's being commented on.
 * initialHtml: Text to prefill the comment editor. In practice, a blockquote of
 *   the selected content.
 * onClose: Called when the close button is clicked on the floating editor.
 */
const PopupLanguageModelChatDialog = ({post, initialHtml, onClose}: {
  post: PostsList,
  initialHtml: string,
  onClose: () => void,
}) => {
  const { PopupLanguageModelChat } = Components;
  return <PopupLanguageModelChat
    onClose={onClose}
  />
  
  // return <PopupCommentEditor
  //   title={"New Comment: " + post.title}
  //   onClose={onClose}
  //   commentFormProps={{
  //     post: post,
  //     prefilledProps: {
  //       contents: {
  //         originalContents: {
  //           type: "ckEditorMarkup",
  //           data: initialHtml,
  //         }
  //       },
  //     },
  //   }}
  // />
}

const PopupLanguageModelChatDialogComponent = registerComponent('PopupLanguageModelChatDialog', PopupLanguageModelChatDialog);

declare global {
  interface ComponentTypes {
    PopupLanguageModelChatDialog: typeof PopupLanguageModelChatDialogComponent
  }
}
