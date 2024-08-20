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
import { useOnServerSentEvent } from '../hooks/useUnreadNotifications';

interface PromptContextOptions {
  postId?: string,
  useRag?: boolean
  includeComments?: boolean
}


type NewLlmMessage = Pick<LlmMessagesFragment,'userId'|'role'|'content'> & { conversationId?: string }
type NewLlmConversation = Pick<LlmConversationsWithMessagesFragment,'userId'> & { _id: string, title?: string, messages: NewLlmMessage[]}
type LlmConversationWithPartialMessages = LlmConversationsFragment & { messages: Array<LlmMessagesFragment|NewLlmMessage> }
type LlmConversation = NewLlmConversation|LlmConversationWithPartialMessages;
type LlmConversationsDict = Record<string, LlmConversation>;

interface LlmChatContextType {
  orderedConversations: LlmConversationsFragment[]
  currentConversation?: LlmConversation
  submitMessage: ( query: string, currentPostId?: string) => void
  // resetConversation: () => void,
  setCurrentConversation: (conversationId?: string) => void
  archiveConversation: (conversationId: string) => void
  loading: boolean
  setLoading: (loading: boolean) => void
}

export const LlmChatContext = React.createContext<LlmChatContextType|null>(null);

export const useLlmChat = (): LlmChatContextType => {
  // const currentUser = useCurrentUser();
  // if (!currentUser) return null;
  const result = React.useContext(LlmChatContext);
  if (!result) throw new Error("useLlmChat called but not a descendent of LlmChatWrapper");
  return result;
}


const LlmChatWrapper = ({children}: {
  children: React.ReactNode
}) => {

  const currentUser = useCurrentUser();

  const [sendClaudeMessage] = useMutation(gql`
    mutation sendClaudeMessageMutation($newMessage: ClaudeMessage!, $promptContextOptions: PromptContextOptions!, $newConversationChannelId: String) {
      sendClaudeMessage(newMessage: $newMessage, promptContextOptions: $promptContextOptions, newConversationChannelId: $newConversationChannelId)
    }
  `)

  const [getClaudeLoadingMessages] = useMutation(gql`
    mutation getClaudeLoadingMessagesMutation($messages: [ClaudeMessage!]!, $postId: String) {
      getClaudeLoadingMessages(messages: $messages, postId: $postId)
    }
  `)

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

  const [conversations, setConversations] = useState<LlmConversationsDict>(userLlmConversationsDict);

  const sortedConversations = useMemo(() => {
    return sortBy(userLlmConversations, (conversation) => -(conversation.lastUpdatedAt ?? conversation.createdAt));
  }, [userLlmConversations]);

  const [currentConversationId, setCurrentConversationId] = useState<string|undefined>(sortedConversations[0]?._id);

  const { document: currentConversationWithMessages } = useSingle({
    collectionName: "LlmConversations",
    fragmentName: "LlmConversationsWithMessagesFragment",
    documentId: currentConversationId,
    skip: !currentConversationId,
  })

  const updateConversations = useCallback((newConversation: LlmConversation|LlmConversationsWithMessagesFragment) => {
    setConversations({
      ...conversations,
      [newConversation._id]: newConversation
    })
  }, [conversations, setConversations])

  useEffect(() => {
    if (currentConversationWithMessages) {
      updateConversations(currentConversationWithMessages)
    }
  },[currentConversationWithMessages, updateConversations]);

  const [ loading, setLoading ] = useState(false)

  // TODO: Ensure code is sanitized against injection attacks
  const submitMessage = useCallback(async (query: string, currentPostId?: string) => {
    // Need to update local state so display is updated
    // Need to submit message to server
    if (!currentUser) return;

    const newConversationChannelId = randomId();

    const currentConversation = currentConversationId ?
      conversations[currentConversationId]
      : {
        _id: newConversationChannelId,
        userId: currentUser._id,
        messages: [],
        createdAt: new Date()
      }

    const newMessage: NewLlmMessage = { 
      conversationId: currentConversation?._id,
      userId: currentUser._id,
      role: "user", 
      content: query,
    };

    const conversationWithNewUserMessage: NewLlmConversation|LlmConversationWithPartialMessages = {
      ...currentConversation,
      messages: [...currentConversation?.messages ?? [], newMessage],
    }

    // Update Client Display
    setLoading(true)
    updateConversations(conversationWithNewUserMessage)


    // TO-DO: where to cause scrolling??
    // if (messagesRef.current) {
    //   messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    // }

    const promptContextOptions: PromptContextOptions = {
      postId: currentPostId,
      includeComments: true //TODO: not always true?
    }

    setTimeout(() => {
      void sendClaudeMessage({
        variables: {
          newMessage,
          promptContextOptions,
          ...(currentConversationId ? {} : { newConversationChannelId }),
        }
      });
    }, 0);
  }, [currentUser, conversations, currentConversationId, updateConversations, sendClaudeMessage])


  // const resetConversation = useCallback(async () => {
  //   setCurrentConversationId(undefined)
  // }, []);

  const setCurrentConversation = useCallback(async (conversationId: string|undefined) => {
    setCurrentConversationId(conversationId)
  }, []);

  const archiveConversation = useCallback(async (conversationId: string) => {
    if (!currentUser) return

    if (currentConversationId === conversationId) {
      setCurrentConversationId(undefined)
    }
    // TODO: ensure list of available convos is updated
    // Shouldn't this happen by default if the view we're using is filtering for `deleted: false`?

    void updateConversation({
      selector: { _id: conversationId },
      data: {
        deleted: true
      }
    })
  }, [currentUser, currentConversationId, updateConversation])

  const currentConversation = useMemo(() => (
    currentConversationId ? conversations[currentConversationId] : undefined
  ), [conversations, currentConversationId]);

  useOnServerSentEvent('llmStream', currentUser, (message) => {
    if (!currentUser) {
      return;
    }

    const { conversationId, displayContent } = message.data;

    const newMessage: NewLlmMessage = { 
      conversationId,
      userId: currentUser._id,
      // TODO: pass back role through stream, maybe even the whole message object?
      role: "assistant", 
      content: displayContent,
    };

    const currentConversation = conversations[conversationId];
    const updatedConversation = {
      ...currentConversation,
      messages: [...currentConversation.messages, newMessage]
    };

    updateConversations(updatedConversation);
    setLoading(false);
  });

  useOnServerSentEvent('llmCreateConversation', currentUser, (message) => {
    const { conversationId, title, createdAt, channelId } = message;
    // console.log(`Got title from stream!  ${message.title}`, { setWindowTitleExists: !!setWindowTitle });
    // setWindowTitle?.(message.title);
    const storageTitle = `llmChatHistory:${message.title}`;
    // const updatedConversations: LlmConversations = {...llmConversations, [storageTitle]: { createdAt: new Date(), lastUpdated: new Date(), messages: currentConversation?.messages ?? [], title: message.title }};
    // setLlmConversations(updatedConversations);
  });


  const llmChatContext = useMemo((): LlmChatContextType => ({
    currentConversation,
    orderedConversations: sortedConversations,
    submitMessage,
    // resetConversation,
    setCurrentConversation,
    archiveConversation,
    loading,
    setLoading
  }), [submitMessage, conversations, currentConversationId, setCurrentConversation, archiveConversation, loading, setLoading]);


  // if (!currentUser) {
  //   return <>
  //   {children}
  //   </>;
  // }

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
