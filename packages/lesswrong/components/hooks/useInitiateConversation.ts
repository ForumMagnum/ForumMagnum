import { useCallback } from "react";
import { useCurrentUser } from "../common/withUser";
import { useMessages } from "../common/withMessages";
import { useTracking } from "../../lib/analyticsEvents";
import { useMutation } from "@apollo/client/react";
import { gql } from "@/lib/generated/gql-codegen";

export interface InitiateConversationOptions {
  /** Always create a fresh conversation, even if one with the same participants already exists */
  forceNew?: boolean;
}

/**
 * Hook to initiate a conversation with a user. By default this gets the existing conversation
 * between these users, or creates a new one if it doesn't exist. Pass `{forceNew: true}` to
 * the callback to always create a new conversation.
 *
 * Note: the initiateConversation callback doesn't return the created conversation, it is returned separately
 * by the hook
 */
export const useInitiateConversation = (props?: {
  includeModerators?: boolean;
}) => {
  const {captureEvent} = useTracking({
    eventType: "initiateConversation",
    eventProps: props,
  });
  const { includeModerators = false } = props || {};

  const currentUser = useCurrentUser();
  const { flash } = useMessages();
  const skip = !currentUser;


  const [initateConversation, { data, loading }] = useMutation(gql(`
    mutation initiateConversation($participantIds: [String!]!, $af: Boolean, $moderator: Boolean, $forceNew: Boolean) {
      initiateConversation(participantIds: $participantIds, af: $af, moderator: $moderator, forceNew: $forceNew) {
        ...ConversationsMinimumInfo
      }
    }
  `), {
    onError: (error) => {
      flash({messageString: "Error initiating conversation", type: "error"});
    },
  });

  const conversation = data?.initiateConversation;

  const wrappedInitiateConversation = useCallback((userIds: string[], options?: InitiateConversationOptions) => {
    const moderatorField = includeModerators ? { moderator: true } : {};
    const forceNewField = options?.forceNew ? { forceNew: true } : {};
    const participantIds = skip || !userIds.length ? [] : [currentUser._id, ...userIds];
  
    void initateConversation({
      variables: { participantIds, ...moderatorField, ...forceNewField },
    });

    captureEvent(undefined, { forceNew: !!options?.forceNew });
  }, [captureEvent, currentUser?._id, includeModerators, initateConversation, skip]);

  return {
    conversation,
    conversationLoading: loading,
    initiateConversation: wrappedInitiateConversation,
  };
};
