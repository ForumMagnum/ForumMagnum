import { useCallback } from "react";
import { gql, useMutation } from "@apollo/client";
import { useUnreadNotifications } from "./useUnreadNotifications";

type MarkConversationRead = (conversationId: string) => Promise<void>;

export const useMarkConversationRead = (): MarkConversationRead => {
  const {refetchUnreadNotifications} = useUnreadNotifications();
  const [markConversationRead] = useMutation(
    gql`
      mutation markConversationRead($conversationId: String!) {
        markConversationRead(conversationId: $conversationId)
      }
    `,
    {errorPolicy: "all"},
  );
  return useCallback(async (conversationId: string) => {
    await markConversationRead({
      variables: {
        conversationId,
      },
    });
    await refetchUnreadNotifications();
  }, [markConversationRead, refetchUnreadNotifications]);
}
