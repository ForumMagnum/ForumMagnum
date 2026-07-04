'use client';

import { useCallback } from 'react';
import { gql } from '@/lib/generated/gql-codegen';
import { useMutation } from '@apollo/client/react';

const MarkResearchConversationReadMutation = gql(`
  mutation MarkResearchConversationRead($conversationId: String!) {
    markResearchConversationRead(conversationId: $conversationId) {
      ok
    }
  }
`);

/**
 * Stamp a conversation as read (clears the sidebar's unread indicator). The
 * server supplies the timestamp — a skewed client clock could otherwise
 * produce a stamp that trails lastActivityAt and never clears the indicator.
 * Fire-and-forget: called whenever the user actually looks at a conversation —
 * opening it from the sidebar, focusing its inline block, opening the chat
 * panel, or watching a turn complete while it's open. Failures are swallowed;
 * the indicator self-corrects on the next successful stamp.
 */
export function useMarkConversationRead(): (conversationId: string) => void {
  const [markRead] = useMutation(MarkResearchConversationReadMutation, {
    // The sidebar's indicator state lives in the polled status query — refresh
    // it so the dot clears immediately rather than on the next poll tick.
    refetchQueries: ['ResearchConversationSidebarStatuses'],
  });
  return useCallback((conversationId: string) => {
    void markRead({ variables: { conversationId } }).catch(() => {});
  }, [markRead]);
}
