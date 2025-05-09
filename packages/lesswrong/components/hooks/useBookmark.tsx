import React, { useState, MouseEvent, useEffect, useCallback } from "react";
import { gql, useMutation } from "@apollo/client";
import { useCurrentUser } from "@/components/common/withUser";
import { useDialog } from "@/components/common/withDialog";
import { useTracking } from "@/lib/analyticsEvents";
import type { ForumIconName } from "@/components/common/ForumIcon";
import { fragmentTextForQuery } from "@/lib/vulcan-lib/fragments";
import { useMulti } from "@/lib/crud/withMulti";
import { LoginPopup } from "../users/LoginPopup";

export interface UseBookmarkResult {
  isBookmarked: boolean;
  toggleBookmark: (event?: MouseEvent) => void;
  loading: boolean;
  icon: ForumIconName;
  labelText: string;
  hoverText: string;
}

export const useBookmark = (
  documentId: string,
  collectionName: "Posts" | "Comments"
): UseBookmarkResult => {
  const currentUser = useCurrentUser();
  const { openDialog } = useDialog();
  const { captureEvent } = useTracking();

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

  const [isBookmarked, setIsBookmarked] = useState<boolean>(false);

  const { results: bookmarkDocs, loading: multiLoading } = useMulti({
    collectionName: "Bookmarks",
    fragmentName: "BookmarksDefaultFragment",
    terms: {
      view: "userDocumentBookmark",
      documentId,
      collectionName,
      userId: currentUser?._id,
    },
    limit: 1,
    enableTotal: false,
    fetchPolicy: "cache-and-network",
    skip: !currentUser || !collectionName,
  });

  useEffect(() => {
    const bookmarkIsActive = !!(bookmarkDocs && bookmarkDocs.length > 0 && bookmarkDocs[0].active);
    setIsBookmarked(bookmarkIsActive);
  }, [bookmarkDocs]);

  const [toggleBookmarkMutation, { loading: mutationLoading, error: mutationError }] = useMutation(
    TOGGLE_BOOKMARK_MUTATION,
    {
      onError: (error) => {
        // eslint-disable-next-line no-console
        console.error("Error toggling bookmark:", error);
      },
    }
  );

  const toggleBookmark = useCallback((event?: MouseEvent) => {
    if (event) event.preventDefault();

    if (!currentUser) {
      openDialog({ name: "LoginPopup", contents: ({onClose}) => <LoginPopup onClose={onClose} /> });
      return;
    }

    if (!collectionName || mutationLoading) {
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

  const loading = multiLoading || mutationLoading;
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
