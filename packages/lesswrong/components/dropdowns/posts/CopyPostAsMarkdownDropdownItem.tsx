import React, { useCallback } from "react";
import { copyTextToClipboard } from "@/lib/clipboardUtils";
import { fetchMarkdownApiText } from "@/lib/markdownApiFetch";
import { useMessages } from "../../common/withMessages";
import DropdownItem from "../DropdownItem";

const CopyPostAsMarkdownDropdownItem = ({post, closeMenu}: {
  post: PostsMinimumInfo,
  closeMenu?: () => void,
}) => {
  const {flash} = useMessages();

  const onClick = useCallback(() => {
    const url = `/api/post/${post._id}?includeComments=1`;
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
      () => flash({messageString: "Post and comments copied as markdown", type: "success"}),
      () => flash({messageString: "Failed to copy post as markdown", type: "error"}),
    );
  }, [post._id, flash, closeMenu]);

  return (
    <DropdownItem
      title="Copy as markdown"
      tooltip="Copy the post and its comments as markdown, for pasting into an LLM"
      icon="Copy"
      onClick={onClick}
    />
  );
};

export default CopyPostAsMarkdownDropdownItem;
