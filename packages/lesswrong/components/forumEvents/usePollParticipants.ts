import { useMemo, useRef } from "react";
import { useMulti } from "@/lib/crud/withMulti";

/**
 * Loads the voters and comments for a forum-event poll, shared by the slider
 * (`ForumEventPoll`) and multiple-choice (`ForumEventMcPoll`) components. Both
 * formats key each vote at the top level of `publicData` by userId, but the
 * multiple-choice poll also stores its answer options/mode there, so the caller
 * supplies the voter id list; the voter/comment fetching, the current user's
 * comment lookup, and the loading flag are identical.
 */
export function usePollParticipants({
  eventId,
  voterIds,
  currentUser,
}: {
  eventId: string | undefined;
  voterIds: string[];
  currentUser: UsersCurrent | null;
}) {
  // `useRef` handles `voters` being briefly undefined while refetching, which
  // would otherwise cause the results avatars to flicker.
  const votersRef = useRef<UsersMinimumInfo[]>([]);
  const { results: voters } = useMulti({
    terms: { view: "usersByUserIds", userIds: voterIds, limit: 1000 },
    collectionName: "Users",
    fragmentName: "UsersMinimumInfo",
    enableTotal: false,
    skip: voterIds.length === 0,
  });
  if (voters !== undefined) {
    votersRef.current = voters;
  }

  const { results: comments, refetch: refetchComments } = useMulti({
    terms: { view: "forumEventComments", forumEventId: eventId, limit: 1000 },
    collectionName: "Comments",
    fragmentName: "ShortformComments",
    enableTotal: false,
    skip: !eventId,
  });

  const currentUserComment = useMemo(
    () => comments?.find((comment) => comment.userId === currentUser?._id) || null,
    [comments, currentUser]
  );

  const votesLoading = voters === undefined && votersRef.current.length === 0;

  return {
    voters: votersRef.current,
    comments,
    currentUserComment,
    refetchComments,
    votesLoading,
  };
}
