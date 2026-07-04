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

export function useMarkConversationRead(): (conversationId: string) => void {
  const [markRead] = useMutation(MarkResearchConversationReadMutation, {
    refetchQueries: ['ResearchConversationSidebarStatuses'],
  });
  return useCallback((conversationId: string) => {
    void markRead({ variables: { conversationId } }).catch(() => {});
  }, [markRead]);
}
