import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { registerComponent } from '../../lib/vulcan-lib';
import { useMulti } from '@/lib/crud/withMulti';
import { useCurrentUser } from '../common/withUser';
import sortBy from 'lodash/sortBy';
import { useSingle } from '@/lib/crud/withSingle';
import { gql, useMutation } from '@apollo/client';
import { useUpdate } from '@/lib/crud/withUpdate';
import keyBy from 'lodash/keyBy';
import { randomId } from '@/lib/random';
import { LlmCreateConversationMessage, useOnServerSentEvent } from '../hooks/useUnreadNotifications';

interface PromptContextOptions {
  postId?: string,
  useRag?: boolean
  includeComments?: boolean
}

type NewLlmMessage = Pick<LlmMessagesFragment, 'userId' | 'role' | 'content'> & { conversationId?: string };
type PreSaveLlmMessage = Omit<NewLlmMessage, 'role'>;
type NewLlmConversation = Pick<LlmConversationsWithMessagesFragment, 'userId'|'createdAt'|'lastUpdatedAt'> & { _id: string, title?: string, messages: NewLlmMessage[] };
type LlmConversationWithPartialMessages = LlmConversationsFragment & { messages: Array<LlmMessagesFragment | NewLlmMessage> };
type LlmConversation = NewLlmConversation | LlmConversationWithPartialMessages;
type LlmConversationsDict = Record<string, LlmConversation>;

interface LlmChatContextType {
  orderedConversations: LlmConversation[];
  currentConversation?: LlmConversation;
  currentConversationLoading: boolean;
  submitMessage: (query: string, currentPostId?: string) => void;
  setCurrentConversation: (conversationId?: string) => void;
  archiveConversation: (conversationId: string) => void;
}

export const LlmChatContext = React.createContext<LlmChatContextType|null>(null);

export const useLlmChat = (): LlmChatContextType => {
  const result = React.useContext(LlmChatContext);
  if (!result) throw new Error("useLlmChat called but not a descendent of LlmChatWrapper");
  return result;
}


const LlmChatWrapper = ({children}: {
  children: React.ReactNode
}) => {

  const currentUser = useCurrentUser();

  const [sendClaudeMessage] = useMutation(gql`
    mutation sendClaudeMessageMutation($newMessage: ClientLlmMessage!, $promptContextOptions: PromptContextOptions!, $newConversationChannelId: String) {
      sendClaudeMessage(newMessage: $newMessage, promptContextOptions: $promptContextOptions, newConversationChannelId: $newConversationChannelId)
    }
  `)

  // TODO: come back to refactor this to use SSEs
  // const [getClaudeLoadingMessages] = useMutation(gql`
  //   mutation getClaudeLoadingMessagesMutation($messages: [ClientLlmMessage!]!, $postId: String) {
  //     getClaudeLoadingMessages(messages: $messages, postId: $postId)
  //   }
  // `)

  const { mutate: updateConversation } = useUpdate({
    collectionName: "LlmConversations",
    fragmentName: "LlmConversationsFragment"
  })

  const { results: userLlmConversations } = useMulti({
    collectionName: "LlmConversations",
    fragmentName: "LlmConversationsFragment",
    terms: { view: "llmConversationsWithUser", userId: currentUser?._id },
    skip: !currentUser,
    enableTotal: false,
  });

  const userLlmConversationsDict = useMemo(() => {
    const conversationsWithMessagesArray = userLlmConversations?.map((conversation) => ({...conversation, messages: []})) 
    return keyBy(conversationsWithMessagesArray, '_id');
  }, [userLlmConversations]);

  const [loadingConversationIds, setLoadingConversationIds] = useState<string[]>([]);
  const [conversations, setConversations] = useState<LlmConversationsDict>(userLlmConversationsDict);

  const sortedConversations = useMemo(() => {
    const llmConversationsList = conversations ? Object.values(conversations) : [];
    return sortBy(llmConversationsList, (conversation) => -(conversation.lastUpdatedAt ?? conversation.createdAt));
  }, [conversations]);

  const [currentConversationId, setCurrentConversationId] = useState<string | undefined>(sortedConversations[0]?._id);

  const { document: currentConversationWithMessages } = useSingle({
    collectionName: "LlmConversations",
    fragmentName: "LlmConversationsWithMessagesFragment",
    documentId: currentConversationId,
    skip: !currentConversationId,
  });

  const currentConversationLoading = useMemo(() => (
    !!currentConversationId && loadingConversationIds.includes(currentConversationId)
  ), [currentConversationId, loadingConversationIds]);

  const currentConversation = useMemo(() => (
    currentConversationId ? conversations[currentConversationId] : undefined
  ), [conversations, currentConversationId]);

  const setConversationLoadingState = useCallback((conversationId: string, loading: boolean) => {
    const conversationInLoadingState = loadingConversationIds.includes(conversationId);
    let updatedLoadingConversationIds: string[] | undefined = undefined;
    if (loading && !conversationInLoadingState) {
      updatedLoadingConversationIds = [...loadingConversationIds, conversationId];
    } else if (!loading && conversationInLoadingState) {
      updatedLoadingConversationIds = loadingConversationIds.filter(id => conversationId !== id);
    }

    if (updatedLoadingConversationIds) {
      setLoadingConversationIds(updatedLoadingConversationIds);
    }
  }, [loadingConversationIds]);

  // TODO: maybe break this out into separate update operations
  const updateConversationById = useCallback((updatedConversation: LlmConversation | LlmConversationsWithMessagesFragment) => {
    setConversations({ ...conversations, [updatedConversation._id]: updatedConversation });
  }, [conversations, setConversations]);

  const hydrateNewConversation = useCallback((newConversationEvent: LlmCreateConversationMessage) => {
    const { title, conversationId, createdAt, userId, channelId } = newConversationEvent;
    const { [channelId]: { messages }, ...rest } = conversations;

    const hydratedConversation: LlmConversationWithPartialMessages = {
      _id: conversationId,
      title,
      messages,
      createdAt: new Date(createdAt),
      deleted: false,
      lastUpdatedAt: new Date(createdAt),
      userId
    };

    const updatedConversations = { [conversationId]: hydratedConversation, ...rest };

    setCurrentConversationId(conversationId);
    setConversations(updatedConversations);
    setConversationLoadingState(conversationId, true);
  }, [conversations, setConversationLoadingState]);

  // TODO: Ensure code is sanitized against injection attacks
  const submitMessage = useCallback(async (query: string, currentPostId?: string) => {
    if (!currentUser) {
      return;
    }

    const newConversationChannelId = randomId();
    const isExistingConversation = !!currentConversation;

    const preSaveConversation = {
      _id: newConversationChannelId,
      userId: currentUser._id,
      messages: [],
      createdAt: new Date(),
      lastUpdatedAt: new Date()
    };

    const displayedConversation = isExistingConversation
      ? currentConversation
      : preSaveConversation;

    // Sent to the server to create a new message
    const preSaveMessage: PreSaveLlmMessage = { conversationId: currentConversation?._id, userId: currentUser._id, content: query };

    // We don't send the role to the server
    const newClientMessage: NewLlmMessage = { ...preSaveMessage, role: 'user' };
    const updatedMessages = [...displayedConversation.messages ?? [], newClientMessage];
    const conversationWithNewUserMessage: LlmConversation = { ...displayedConversation, messages: updatedMessages };

    // Update Client Display
    setConversationLoadingState(displayedConversation._id, true);
    updateConversationById(conversationWithNewUserMessage);

    if (!isExistingConversation) {
      setCurrentConversationId(newConversationChannelId);
    }

    const promptContextOptions: PromptContextOptions = { postId: currentPostId, includeComments: true /* TODO: this currently doesn't do anything; it's hardcoded on the server */ };

    void sendClaudeMessage({
      variables: {
        newMessage: preSaveMessage,
        promptContextOptions,
        ...(isExistingConversation ? {} : { newConversationChannelId }),
      }
    });
  }, [currentUser, currentConversation, sendClaudeMessage, updateConversationById, setConversationLoadingState]);

  const setCurrentConversation = useCallback(setCurrentConversationId, [setCurrentConversationId]);

  const archiveConversation = useCallback(async (conversationId: string) => {
    if (!currentUser) {
      return;
    }

    if (currentConversationId === conversationId) {
      setCurrentConversationId(undefined);
    }

    // remove conversation with this id from conversations object
    const { [conversationId]: _, ...rest } = conversations;
    setConversations(rest);

    void updateConversation({
      selector: { _id: conversationId },
      data: {
        deleted: true
      }
    })
  }, [currentUser, conversations, currentConversationId, updateConversation]);

  useOnServerSentEvent('llmCreateConversation', currentUser, (message) => {
    hydrateNewConversation(message);
  });

  useOnServerSentEvent('llmStreamContent', currentUser, (message) => {
    if (!currentUser) {
      return;
    }

    const { conversationId, content, previousUserMessage } = message.data;

    const streamConversation = conversations[conversationId];
    const updatedMessages = [...streamConversation.messages];
    const lastMessageInConversation = updatedMessages.slice(-1)[0];
    const lastClientMessageIsAssistant = lastMessageInConversation?.role === 'assistant';

    const newMessage: NewLlmMessage = { 
      conversationId,
      userId: currentUser._id,
      // TODO: pass back role through stream, maybe even the whole message object?
      role: "assistant", 
      content,
    };
    
    // previousUserMessage only gets sent with the first stream event for any given message response
    if (previousUserMessage && lastClientMessageIsAssistant) {
      updatedMessages.push(previousUserMessage, newMessage);
    } else {
      // Since we're sending an aggregate buffer rather than diffs, we need to replace the last message in the conversation each time we get one (after the first time)
      if (lastClientMessageIsAssistant) {
        updatedMessages.pop();
      }
      updatedMessages.push(newMessage);
    }

    const updatedConversation = { ...streamConversation, messages: updatedMessages };
    
    updateConversationById(updatedConversation);
    setConversationLoadingState(conversationId, false);
  });

  useOnServerSentEvent('llmStreamEnd', currentUser, (message) => {
    // TODO: Maybe redundant as already is turning off loading state in streamContent
    setConversationLoadingState(message.data.conversationId, false);
  });

  useEffect(() => {
    if (currentConversationWithMessages) {
      const clientSideConversationState = conversations[currentConversationWithMessages._id];
      if (currentConversationWithMessages.messages.length > clientSideConversationState.messages.length) {
        updateConversationById(currentConversationWithMessages);
      }
    }
  }, [currentConversationWithMessages, conversations, updateConversationById]);

  const llmChatContext = useMemo((): LlmChatContextType => ({
    currentConversation,
    currentConversationLoading,
    orderedConversations: sortedConversations,
    submitMessage,
    setCurrentConversation,
    archiveConversation,
  }), [submitMessage, setCurrentConversation, archiveConversation, currentConversationLoading, currentConversation, sortedConversations]);

  return <LlmChatContext.Provider value={llmChatContext}>
    {children}
  </LlmChatContext.Provider>
}

const LlmChatWrapperComponent = registerComponent("LlmChatWrapper", LlmChatWrapper);

declare global {
  interface ComponentTypes {
    LlmChatWrapper: typeof LlmChatWrapperComponent
  }
}
