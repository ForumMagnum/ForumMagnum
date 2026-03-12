import React from 'react';
import PopupCommentEditor from "./PopupCommentEditor";
import { useCurrentUser } from "../common/withUser";
import { getUserDefaultRichTextEditor } from "@/lib/editor/defaultRichTextEditor";

/**
 * ReplyCommentDialog: A floating comment editor created by clicking the comment
 * button on a selected-text toolbar (see CommentOnSelectionPageWrapper).
 *
 * post: The post that's being commented on.
 * initialHtml: Text to prefill the comment editor. In practice, a blockquote of
 *   the selected content.
 * onClose: Called when the close button is clicked on the floating editor.
 */
const ReplyCommentDialog = ({post, initialHtml, onClose}: {
  post: PostsList,
  initialHtml: string,
  parentComment?: CommentsList,
  onClose: () => void,
}) => {
  const currentUser = useCurrentUser();
  const defaultEditorType = getUserDefaultRichTextEditor(currentUser);

  return <PopupCommentEditor
    title={"New Comment: " + post.title}
    onClose={onClose}
    commentFormProps={{
      post: post,
      prefilledProps: {
        contents: {
          originalContents: {
            type: defaultEditorType,
            data: initialHtml,
          }
        },
      },
    }}
  />
}

export default ReplyCommentDialog;


