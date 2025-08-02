import { useCallback } from "react";
import { useMutation } from "@apollo/client/react";
import { gql } from "@/lib/generated/gql-codegen";

import { useUnreadNotifications } from "./useUnreadNotifications";

type MarkConversationRead = (conversationId: string) => Promise<void>;

export const useMarkConversationRead = (): MarkConversationRead => {
  const {refetchUnreadNotifications} = useUnreadNotifications();
  const [markConversationRead] = useMutation(
    gql(`
      mutation markConversationRead($conversationId: String!) {
        markConversationRead(conversationId: $conversationId)
      }
    `),
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
