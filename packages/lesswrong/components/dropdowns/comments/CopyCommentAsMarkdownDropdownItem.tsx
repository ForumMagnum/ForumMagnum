import React, { useCallback } from "react";
import { copyTextToClipboard } from "@/lib/clipboardUtils";
import { fetchMarkdownApiText } from "@/lib/markdownApiFetch";
import { useMessages } from "../../common/withMessages";
import DropdownItem from "../DropdownItem";

const CopyCommentAsMarkdownDropdownItem = ({comment, closeMenu}: {
  comment: CommentsList,
  closeMenu?: () => void,
}) => {
  const {flash} = useMessages();
  const postId = comment.postId;

  const onClick = useCallback(() => {
    const url = `/api/post/${postId}/comments/${comment._id}?includeParents=1`;
    // Everything up to `window.open` runs synchronously inside the click
    // handler: `copyTextToClipboard` invokes the clipboard API before its
    // first await (Safari revokes the transient activation across awaits, and
    // Chrome checks document focus when `write()` is called), and popup
    // blockers only allow `window.open` within the user activation. Clipboard
    // first, so a blocked popup can't take the copy down with it.
    const copyPromise = copyTextToClipboard(fetchMarkdownApiText(url));
    window.open(url, "_blank", "noopener,noreferrer");
    closeMenu?.();
    copyPromise.then(
      () => flash({messageString: "Comment copied as markdown, with its post and parent comments", type: "success"}),
      () => flash({messageString: "Failed to copy comment as markdown", type: "error"}),
    );
  }, [postId, comment._id, flash, closeMenu]);

  // Comments without a post (eg on tag pages) have no markdown API route.
  if (!postId) {
    return null;
  }

  return (
    <DropdownItem
      title="Copy as markdown"
      tooltip="Copy the comment, its post, and its parent comments as markdown, for pasting into an LLM"
      icon="Copy"
      onClick={onClick}
    />
  );
};

export default CopyCommentAsMarkdownDropdownItem;
