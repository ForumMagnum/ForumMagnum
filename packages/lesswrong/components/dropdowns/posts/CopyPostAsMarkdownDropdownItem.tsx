import React, { useCallback, useState } from "react";
import { useApolloClient } from "@apollo/client/react";
import { gql } from "@/lib/generated/gql-codegen";
import { postToMarkdown } from "@/lib/copyAsMarkdown";
import { copyTextToClipboard } from "@/lib/clipboardUtils";
import { useMessages } from "../../common/withMessages";
import DropdownItem from "../DropdownItem";

const PostMarkdownCopyQuery = gql(`
  query CopyPostAsMarkdown($documentId: String) {
    post(input: { selector: { documentId: $documentId } }) {
      result {
        ...PostsMarkdownCopy
      }
    }
  }
`);

const CopyPostAsMarkdownDropdownItem = ({post, closeMenu}: {
  post: PostsMinimumInfo,
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
      query: PostMarkdownCopyQuery,
      variables: {documentId: post._id},
      fetchPolicy: "cache-first",
    }).then(({data}) => {
      const fetchedPost = data?.post?.result;
      if (!fetchedPost) {
        throw new Error("Post not found");
      }
      return postToMarkdown(fetchedPost);
    });

    try {
      await copyTextToClipboard(markdownPromise);
      flash({messageString: "Post copied as markdown", type: "success"});
    } catch {
      flash({messageString: "Failed to copy post as markdown", type: "error"});
    } finally {
      setLoading(false);
      closeMenu?.();
    }
  }, [client, post._id, flash, closeMenu]);

  return (
    <DropdownItem
      title="Copy as markdown"
      tooltip="Copy the post as markdown, for pasting into an LLM"
      icon="Copy"
      loading={loading}
      onClick={onClick}
    />
  );
};

export default CopyPostAsMarkdownDropdownItem;
