import React, { useState, MouseEvent, useEffect, useCallback } from "react";
import { useMutation } from "@apollo/client/react";
import { useQuery } from "@/lib/crud/useQuery"
import { gql } from "@/lib/generated/gql-codegen";
import { useCurrentUserId } from "@/components/common/withUser";
import { useDialog } from "@/components/common/withDialog";
import { useTracking } from "@/lib/analyticsEvents";
import type { ForumIconName } from "@/components/common/ForumIcon";
import { BookmarkableCollectionName } from "@/lib/collections/bookmarks/constants";
import LoginPopup from "../users/LoginPopup";

const BookmarksMinimumInfoMultiQuery = gql(`
  query multiBookmarkuseBookmarkQuery($selector: BookmarkSelector, $limit: Int, $enableTotal: Boolean) {
    bookmarks(selector: $selector, limit: $limit, enableTotal: $enableTotal) {
      results {
        ...BookmarksMinimumInfoFragment
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
  collectionName: BookmarkableCollectionName,
  initial?: boolean
): UseBookmarkResult => {
  const currentUserId = useCurrentUserId();
  const { openDialog } = useDialog();
  const { captureEvent } = useTracking();
  const shouldUseInitial = typeof initial === "boolean";

  const SET_BOOKMARK_MUTATION = gql(`
    mutation SetIsBookmarkedMutation($input: SetIsBookmarkedInput!) {
      setIsBookmarked(input: $input) {
        data {
          ...BookmarksMinimumInfoFragment
        }
      }
    }
  `);

  const [isBookmarked, setIsBookmarked] = useState<boolean>(initial ?? false);

  const { data, loading: multiLoading } = useQuery(BookmarksMinimumInfoMultiQuery, {
    variables: {
      selector: { userDocumentBookmark: { documentId, collectionName, userId: currentUserId } },
      limit: 1,
      enableTotal: false,
    },
    skip: !currentUserId || !collectionName || shouldUseInitial,
    fetchPolicy: "cache-and-network",
    notifyOnNetworkStatusChange: true,
  });

  const bookmarkDocs = data?.bookmarks?.results;

  useEffect(() => {
    if (shouldUseInitial) {
      setIsBookmarked(initial ?? false);
      return;
    }

    const bookmarkIsActive = !!(bookmarkDocs && bookmarkDocs.length > 0 && bookmarkDocs[0].active);
    setIsBookmarked(bookmarkIsActive);
  }, [bookmarkDocs, initial, shouldUseInitial]);

  const [setBookmarkMutation, { loading: mutationLoading, error: mutationError }] = useMutation(
    SET_BOOKMARK_MUTATION,
    {
      onError: (error) => {
        // eslint-disable-next-line no-console
        console.error("Error setting bookmark:", error);
      },
    }
  );

  const toggleBookmark = useCallback((event?: MouseEvent) => {
    if (event) event.preventDefault();

    if (!currentUserId) {
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

    setBookmarkMutation({
      variables: {
        input: { documentId, collectionName, isBookmarked: !previousState },
      },
    }).catch(() => {
      // Revert optimistic update on error
      setIsBookmarked(previousState);
    });

  }, [currentUserId, documentId, collectionName, isBookmarked, mutationLoading, openDialog, setBookmarkMutation, captureEvent]);

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
