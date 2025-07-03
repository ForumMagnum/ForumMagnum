import React, { useState, MouseEvent, useEffect, useCallback } from "react";
import { useMutation } from "@apollo/client/react";
import { useQuery } from "@/lib/crud/useQuery"
import { gql } from "@/lib/generated/gql-codegen";
import { useCurrentUser } from "@/components/common/withUser";
import { useDialog } from "@/components/common/withDialog";
import { useTracking } from "@/lib/analyticsEvents";
import type { ForumIconName } from "@/components/common/ForumIcon";
import { BookmarkableCollectionName } from "@/lib/collections/bookmarks/constants";
import LoginPopup from "../users/LoginPopup";

const BookmarksDefaultFragmentMultiQuery = gql(`
  query multiBookmarkuseBookmarkQuery($selector: BookmarkSelector, $limit: Int, $enableTotal: Boolean) {
    bookmarks(selector: $selector, limit: $limit, enableTotal: $enableTotal) {
      results {
        ...BookmarksDefaultFragment
      }
      totalCount
    }
  }
`);

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
  collectionName: BookmarkableCollectionName
): UseBookmarkResult => {
  const currentUser = useCurrentUser();
  const { openDialog } = useDialog();
  const { captureEvent } = useTracking();

  const TOGGLE_BOOKMARK_MUTATION = gql(`
    mutation ToggleBookmarkMutation($input: ToggleBookmarkInput!) {
      toggleBookmark(input: $input) {
        data {
          ...BookmarksDefaultFragment
        }
      }
    }
  `);

  const [isBookmarked, setIsBookmarked] = useState<boolean>(false);

  const { data, loading: multiLoading } = useQuery(BookmarksDefaultFragmentMultiQuery, {
    variables: {
      selector: { userDocumentBookmark: { documentId, collectionName, userId: currentUser?._id } },
      limit: 1,
      enableTotal: false,
    },
    skip: !currentUser || !collectionName,
    fetchPolicy: "cache-and-network",
    notifyOnNetworkStatusChange: true,
  });

  const bookmarkDocs = data?.bookmarks?.results;

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
