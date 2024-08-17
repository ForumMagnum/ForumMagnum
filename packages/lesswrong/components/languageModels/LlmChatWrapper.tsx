import React, { useCallback, useMemo, useState } from 'react';
import { registerComponent } from '../../lib/vulcan-lib';
import { useMulti } from '@/lib/crud/withMulti';
import { useCurrentUser } from '../common/withUser';
import { sortBy } from 'lodash';
import { useSingle } from '@/lib/crud/withSingle';


interface ClaudeMessage {
  role: string
  content: string
  displayContent?: string
}


interface PromptContextOptions {
  query: string
  postId?: string,
  useRag?: boolean
  includeComments?: boolean
}

interface LlmChatContextType {
  currentConversation?: LlmConversationsWithMessagesFragment
  setCurrentConversation: (conversation: LlmConversationsWithMessagesFragment) => void
}

export const LlmChatContext = React.createContext<LlmChatContextType|null>(null);

const LlmChatWrapper = ({children}: {
  children: React.ReactNode
}) => {

  const currentUser = useCurrentUser();
  const { results: userLlmConversations } = useMulti({
    collectionName: "LlmConversations",
    fragmentName: "LlmConversationsFragment",
    terms: { view: "llmConversationsWithUser", userId: currentUser?._id },
    skip: !currentUser,
  });

  const sortedConversations = useMemo(() => {
    return sortBy(userLlmConversations, (conversation) => -(conversation.lastUpdatedAt ?? conversation.createdAt));
  }, [userLlmConversations]);

  const { document: mostRecentConversation } = useSingle({
    collectionName: "LlmConversations",
    fragmentName: "LlmConversationsWithMessagesFragment",
    documentId: sortedConversations[0]?._id ,
    skip: !sortedConversations[0],
  })
  
  sortedConversations[0]?._id;

  const [currentConversation, setCurrentConversation] = useState<LlmConversationWithMessages|undefined>(mostRecentConversation);

  if (!currentUser) {
    return children;
  }



}
