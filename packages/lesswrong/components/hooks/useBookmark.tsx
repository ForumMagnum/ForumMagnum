import React, { useState, MouseEvent, useEffect, useCallback } from "react";
import { gql, useMutation, useQuery } from "@apollo/client";
import { useCurrentUser } from "@/components/common/withUser";
import { useDialog } from "@/components/common/withDialog";
import { useTracking } from "@/lib/analyticsEvents";
import type { ForumIconName } from "@/components/common/ForumIcon";
import { Components } from "@/lib/vulcan-lib/components";
import { fragmentTextForQuery } from "@/lib/vulcan-lib/fragments";
interface BookmarkableDocumentInput {
  _id: string;
  __typename: "Post" | "Comment";
}

export interface UseBookmarkResult {
  isBookmarked: boolean;
  toggleBookmark: (event?: MouseEvent) => void;
  loading: boolean;
  icon: ForumIconName;
  labelText: string;
  hoverText: string;
}

const TOGGLE_BOOKMARK_MUTATION = gql`
  mutation ToggleBookmarkMutation($input: ToggleBookmarkInput!) {
    toggleBookmark(input: $input) {
      data {
        ...BookmarksDefaultFragment
      }
    }
  }
  ${fragmentTextForQuery('BookmarksDefaultFragment')}
`;

const GET_BOOKMARK_STATUS_QUERY = gql`
  query GetBookmarkStatus($selector: BookmarkSelectorInput!) {
    bookmark(input: { selector: $selector }) {
      result {
        _id
        cancelled
      }
    }
  }
`;

export const useBookmark = (document: BookmarkableDocumentInput | null | undefined): UseBookmarkResult => {
  const currentUser = useCurrentUser();
  const { openDialog } = useDialog();
  const { captureEvent } = useTracking();

  const documentId = document?._id;
  const collectionName = document?.__typename;

  const [isBookmarked, setIsBookmarked] = useState<boolean>(false);
  const [initialCheckDone, setInitialCheckDone] = useState<boolean>(false);

  const { loading: queryLoading, error: queryError } = useQuery(
    GET_BOOKMARK_STATUS_QUERY,
    {
      variables: {
        selector: {
          documentId: documentId,
          collectionName: collectionName,
          userId: currentUser?._id,
          cancelled: false,
        },
      },
      skip: !currentUser || !documentId || !collectionName || initialCheckDone,
      fetchPolicy: 'cache-and-network',
      onCompleted: (data) => {
        setIsBookmarked(!!data?.bookmark?.result?._id);
        setInitialCheckDone(true);
      },
      onError: (error) => {
        console.error("Error fetching bookmark status:", error);
        setInitialCheckDone(true); // Mark as done even on error
      }
    }
  );

  const [toggleBookmarkMutation, { loading: mutationLoading, error: mutationError }] = useMutation(
    TOGGLE_BOOKMARK_MUTATION,
    {
      onError: (error) => {
        console.error("Error toggling bookmark:", error);
      },
    }
  );

  const toggleBookmark = useCallback((event?: MouseEvent) => {
    if (event) event.preventDefault();

    if (!currentUser) {
      openDialog({ name: "LoginPopup", contents: ({onClose}) => <Components.LoginPopup onClose={onClose} /> });
      return;
    }

    if (!documentId || !collectionName || mutationLoading) {
      return;
    }

    // Optimistically update the UI state
    const previousState = isBookmarked;
    setIsBookmarked(!previousState);

    captureEvent("bookmarkToggle", { documentId, collectionName, bookmarked: !previousState });

    toggleBookmarkMutation({
      variables: {
        input: { documentId, collectionName },
      },
    }).catch(() => {
      // Revert optimistic update on error
      setIsBookmarked(previousState);
    });

  }, [currentUser, documentId, collectionName, isBookmarked, mutationLoading, openDialog, toggleBookmarkMutation, captureEvent]);

  const loading = queryLoading || mutationLoading;
  const icon: ForumIconName = isBookmarked ? "Bookmark" : "BookmarkBorder";
  const labelText = isBookmarked ? "Saved" : "Save";
  const hoverText = isBookmarked ? "Remove from saved items" : "Save for later";

  return {
    isBookmarked,
    toggleBookmark,
    loading,
    icon,
    labelText,
    hoverText,
  };
}; 