import { useCallback, useEffect, useState } from "react";
import { useMulti } from "../../lib/crud/withMulti";
import { isAF } from "../../lib/instanceSettings";
import { useCurrentUser } from "../common/withUser";
import { useMessages } from "../common/withMessages";
import { useTracking } from "../../lib/analyticsEvents";

/**
 * Hook to initiate a conversation with a user. This get's the existing conversation (first conversation
 * between these users with no title), or creates a new one if it doesn't exist.
 *
 * Note: the initiateConversation callback doesn't return the created conversation, it is returned separately
 * by the hook
 */
export const useInitiateConversation = (props?: {
  includeModerators?: boolean;
  /** If given the conversation will be initiated immediately */
  userIds?: string[]
}) => {
  const {captureEvent} = useTracking({
    eventType: "initiateConversation",
    eventProps: props,
  });
  const { includeModerators = false } = props || {};

  const currentUser = useCurrentUser();
  const { flash } = useMessages();
  const [userIds, setUserIds] = useState<string[] | null>(props?.userIds ?? null);
  const skip = !currentUser || !userIds?.length

  const alignmentFields = isAF ? { af: true } : {};
  const moderatorField = includeModerators ? { moderator: true } : {};

  const participantIds = skip ? [] : [currentUser._id, ...userIds];

  const { results, loading, error } = useMulti({
    terms: {
      view: "userGroupUntitledConversations",
      userId: currentUser?._id,
      participantIds,
      ...moderatorField,
    },
    collectionName: "Conversations",
    fragmentName: "ConversationsMinimumInfo",
    fetchPolicy: "network-only",
    limit: 1,
    skip,
    createIfMissing: {
      participantIds,
      ...alignmentFields,
      ...moderatorField,
    },
  });

  // If there is an error in executing the query, reset and flash a message
  useEffect(() => {
    if (error) {
      flash({messageString: "Error initiating conversation", type: "error"});
      setUserIds(null);
    }
  }, [error, flash])

  const conversation = results?.[0];

  const initiateConversation = useCallback((userIds: string[]) => {
    setUserIds(userIds?.length ? userIds : null);
    captureEvent();
  }, [captureEvent]);

  return {
    conversation,
    conversationLoading: loading,
    initiateConversation,
  };
};
