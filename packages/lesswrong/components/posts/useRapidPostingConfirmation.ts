import { useCallback, useRef, useState } from "react";
import { useApolloClient } from "@apollo/client/react";
import type { ApolloClient } from "@apollo/client";
import { gql } from "@/lib/generated/gql-codegen";
import { useCurrentUser } from "../common/withUser";
import type { EditablePost } from "@/lib/collections/posts/helpers";

const RAPID_POSTING_WINDOW_MS = 10 * 60 * 1000;

const RAPID_POSTING_CONFIRMATION_MESSAGE = "You published another post less than 10 minutes ago. Posts are usually better received if they're either combined into a single post, or spread out over time.\n\nPublish anyway?";

const RecentUserPostsQuery = gql(`
  query RapidPostingConfirmationRecentPosts($userId: String!) {
    posts(selector: { userPosts: { userId: $userId, sortedBy: "new", authorIsUnreviewed: null } }, limit: 3) {
      results {
        _id
        postedAt
        shortform
        isEvent
      }
    }
  }
`);

interface RecentPostInfo {
  _id: string,
  postedAt: string,
  shortform: boolean,
  isEvent: boolean,
}

export function hasRecentlyPublishedPost(recentPosts: RecentPostInfo[], currentPostId: string | undefined, now: Date): boolean {
  return recentPosts.some(post =>
    post._id !== currentPostId
    && !post.shortform
    && !post.isEvent
    && now.getTime() - new Date(post.postedAt).getTime() < RAPID_POSTING_WINDOW_MS
  );
}

async function confirmIfPostingRapidly(client: ApolloClient, userId: string, currentPostId: string | undefined): Promise<boolean> {
  let recentPosts: RecentPostInfo[];
  try {
    const { data } = await client.query({
      query: RecentUserPostsQuery,
      variables: { userId },
      fetchPolicy: "network-only",
    });
    recentPosts = data?.posts?.results ?? [];
  } catch (e) {
    // This is only a soft nudge, so don't block publishing if the check fails
    // eslint-disable-next-line no-console
    console.error("Failed to check for recently published posts", e);
    return true;
  }
  if (!hasRecentlyPublishedPost(recentPosts, currentPostId, new Date())) {
    return true;
  }
  return window.confirm(RAPID_POSTING_CONFIRMATION_MESSAGE);
}

interface RapidPostingConfirmation {
  /**
   * Call with the post's current form values and await before publishing.
   * Resolves to false if the user chose not to publish, or if another check
   * is already in progress.
   */
  confirmRapidPosting: (document: EditablePost) => Promise<boolean>,
  /**
   * True while waiting for the recent-posts query. The form isn't submitting
   * yet during this time, so callers should disable their submit buttons.
   */
  isCheckingRapidPosting: boolean,
}

/**
 * Soft rate limit: if the author published another (non-event) post within the
 * last few minutes, ask them to confirm before publishing this one.
 */
export function useRapidPostingConfirmation(): RapidPostingConfirmation {
  const currentUser = useCurrentUser();
  const client = useApolloClient();
  const userId = currentUser?._id;
  // The check needs a network round trip before the form starts submitting,
  // so guard against a double click starting a second check (and then a
  // second submit) in the meantime.
  const checkInProgress = useRef(false);
  const [isCheckingRapidPosting, setIsCheckingRapidPosting] = useState(false);

  const confirmRapidPosting = useCallback(async (document: EditablePost) => {
    if (checkInProgress.current) {
      return false;
    }
    // Only relevant when this submit would publish a post that isn't already
    // published. Events are exempt.
    if (!userId || document.draft === false || document.isEvent) {
      return true;
    }
    checkInProgress.current = true;
    setIsCheckingRapidPosting(true);
    try {
      return await confirmIfPostingRapidly(client, userId, document._id);
    } finally {
      checkInProgress.current = false;
      setIsCheckingRapidPosting(false);
    }
  }, [client, userId]);

  return { confirmRapidPosting, isCheckingRapidPosting };
}
