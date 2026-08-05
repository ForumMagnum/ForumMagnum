import React, { useCallback, useState } from "react";
import { useApolloClient } from "@apollo/client/react";
import { gql } from "@/lib/generated/gql-codegen";
import { commentToMarkdown } from "@/lib/copyAsMarkdown";
import { copyTextToClipboard } from "@/lib/clipboardUtils";
import { useMessages } from "../../common/withMessages";
import DropdownItem from "../DropdownItem";

const CommentMarkdownCopyQuery = gql(`
  query CopyCommentAsMarkdown($documentId: String) {
    comment(input: { selector: { documentId: $documentId } }) {
      result {
        ...CommentsMarkdownCopyWithParents
      }
    }
  }
`);

const CopyCommentAsMarkdownDropdownItem = ({comment, closeMenu}: {
  comment: CommentsList,
  closeMenu?: () => void,
}) => {
  const {flash} = useMessages();
  const [loading, setLoading] = useState(false);
  // Deliberately not `useLazyQuery`: clicking a menu item closes the menu,
  // which unmounts this component and would abort a hook-owned query.
  const client = useApolloClient();

  const onClick = useCallback(async () => {
    setLoading(true);
    // Started, not awaited, so the clipboard write still counts as
    // responding to the click. See `copyTextToClipboard`.
    const markdownPromise = client.query({
      query: CommentMarkdownCopyQuery,
      variables: {documentId: comment._id},
      fetchPolicy: "cache-first",
    }).then(({data}) => {
      const fetchedComment = data?.comment?.result;
      if (!fetchedComment) {
        throw new Error("Comment not found");
      }
      return commentToMarkdown(fetchedComment);
    });

    try {
      await copyTextToClipboard(markdownPromise);
      flash({messageString: "Comment copied as markdown, with parent post and comments", type: "success"});
    } catch {
      flash({messageString: "Failed to copy comment as markdown", type: "error"});
    } finally {
      setLoading(false);
      closeMenu?.();
    }
  }, [client, comment._id, flash, closeMenu]);

  return (
    <DropdownItem
      title="Copy as markdown"
      tooltip="Copy the comment, plus the post and thread it's in, as markdown for pasting into an LLM"
      icon="Copy"
      loading={loading}
      onClick={onClick}
    />
  );
};

export default CopyCommentAsMarkdownDropdownItem;
