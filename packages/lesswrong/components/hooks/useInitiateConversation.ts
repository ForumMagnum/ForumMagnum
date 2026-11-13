import { useCallback } from "react";
import { useCurrentUser } from "../common/withUser";
import { useMessages } from "../common/withMessages";
import { useTracking } from "../../lib/analyticsEvents";
import { useMutation } from "@apollo/client/react";
import { gql } from "@/lib/generated/gql-codegen";

/**
 * Hook to initiate a conversation with a user. This get's the existing conversation (first conversation
 * between these users with no title), or creates a new one if it doesn't exist.
 *
 * Note: the initiateConversation callback doesn't return the created conversation, it is returned separately
 * by the hook
 */
export const useInitiateConversation = (props?: {
  includeModerators?: boolean;
}) => {
  // Callers pass a fresh props object every render. useTracking rebuilds
  // captureEvent when eventProps' identity changes, and the supermod composer
  // starts a conversation from an effect keyed on that callback — so passing
  // props through here retriggers the mutation (and its error flash) forever.
  const {captureEvent} = useTracking({
    eventType: "initiateConversation",
  });
  const { includeModerators = false } = props || {};

  const currentUser = useCurrentUser();
  const { flash } = useMessages();
  const skip = !currentUser;


  const [initateConversation, { data, loading }] = useMutation(gql(`
    mutation initiateConversation($participantIds: [String!]!, $af: Boolean, $moderator: Boolean) {
      initiateConversation(participantIds: $participantIds, af: $af, moderator: $moderator) {
        ...ConversationsMinimumInfo
      }
    }
  `), {
    onError: (error) => {
      flash({messageString: "Error initiating conversation", type: "error"});
    },
  });

  const conversation = data?.initiateConversation;

  const wrappedInitiateConversation = useCallback((userIds: string[]) => {
    const moderatorField = includeModerators ? { moderator: true } : {};
    const participantIds = skip || !userIds.length ? [] : [currentUser._id, ...userIds];
  
    void initateConversation({
      variables: { participantIds, ...moderatorField },
    });

    captureEvent(undefined, { includeModerators });
  }, [captureEvent, currentUser?._id, includeModerators, initateConversation, skip]);

  return {
    conversation,
    conversationLoading: loading,
    initiateConversation: wrappedInitiateConversation,
  };
};
