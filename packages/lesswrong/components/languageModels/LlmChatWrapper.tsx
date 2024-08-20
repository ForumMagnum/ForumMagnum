import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { registerComponent } from '../../lib/vulcan-lib';
import { useMulti } from '@/lib/crud/withMulti';
import { useCurrentUser } from '../common/withUser';
import sortBy from 'lodash/sortBy';
import { useSingle } from '@/lib/crud/withSingle';
import { gql, useMutation } from '@apollo/client';
import { useUpdate } from '@/lib/crud/withUpdate';
import keyBy from 'lodash/keyBy';
import { last, random } from 'underscore';
import { randomId } from '@/lib/random';

interface PromptContextOptions {
  postId?: string,
  useRag?: boolean
  includeComments?: boolean
}


type NewLlmMessage = Pick<LlmMessagesFragment,'userId'|'role'|'content'> & { conversationId?: string }
type NewLlmConversation = Pick<LlmConversationsWithMessagesFragment,'userId'> & { _id: string, title?: string, messages: NewLlmMessage[]}
type LlmConversationWithPartialMessages = LlmConversationsFragment & { messages: Array<LlmMessagesFragment|NewLlmMessage> }
type LlmConversationsDict = Record<string,NewLlmConversation|LlmConversationWithPartialMessages>

interface LlmChatContextType {
  conversations: LlmConversationsDict
  currentConversationId: string|undefined
  submitMessage: ( query: string, currentPostId?: string) => void
  // resetConversation: () => void,
  switchConversation: (conversationId: string|undefined) => void
  archiveConversation: (conversationId: string) => void
  loading: boolean
  setLoading: (loading: boolean) => void
}

export const LlmChatContext = React.createContext<LlmChatContextType|null>(null);

const LlmChatWrapper = ({children}: {
  children: React.ReactNode
}) => {

  const currentUser = useCurrentUser();

  const [sendClaudeMessage] = useMutation(gql`
    mutation sendClaudeMessageMutation($newMessage: ClaudeMessage!, $promptContextOptions: PromptContextOptions!) {
      sendClaudeMessage(newMessage: $newMessage, promptContextOptions: $promptContextOptions)
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

  const updateCurrentConversation = useCallback((newConversation: NewLlmConversation|LlmConversationWithPartialMessages|LlmConversationsWithMessagesFragment) => {
    setConversations({
      ...conversations,
      [newConversation._id ?? ""]: newConversation
    })
  }, [conversations, setConversations])

  useEffect(() => {
    if (currentConversationWithMessages) {
      updateCurrentConversation(currentConversationWithMessages)
    }
  },[currentConversationWithMessages, updateCurrentConversation]);

  const [ loading, setLoading ] = useState(false)

// TODO: Ensure code is sanitized against injection attacks
  const submitMessage = useCallback(async (query: string, currentPostId?: string) => {
    // Need to update local state so display is updated
    // Need to submit message to server
    if (!currentUser) return

    const currentConversation = currentConversationId ?
      conversations[currentConversationId] as LlmConversationWithPartialMessages
      : {
        _id: randomId(),
        userId: currentUser._id,
        messages: [],
        lastUpdatedAt: new Date()
      }

    let newMessage: NewLlmMessage = { 
      conversationId: currentConversation?._id,
      userId: currentUser?._id,
      role: "user", 
      content: query,
    }

    const conversationWithNewUserMessage: NewLlmConversation|LlmConversationWithPartialMessages = {
      ...currentConversation,
      messages: [...currentConversation?.messages ?? [], newMessage],
    }

    // Update Client Display
    setLoading(true)
    updateCurrentConversation(conversationWithNewUserMessage)


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
        }
      });
    }, 0);
  }, [currentUser, conversations, currentConversationId, updateCurrentConversation, sendClaudeMessage])


  // const resetConversation = useCallback(async () => {
  //   setCurrentConversationId(undefined)
  // }, []);

  const switchConversation = useCallback(async (conversationId: string|undefined) => {
    setCurrentConversationId(conversationId)
  }, []);

  const archiveConversation = useCallback(async (conversationId: string) => {
    if (!currentUser) return

    if (currentConversationId === conversationId) {
      setCurrentConversationId(undefined)
    }
    // TODO: ensure list of available convos is updated

    void updateConversation({
      selector: { _id: conversationId },
      data: {
        deleted: true
      }
    })
  }, [currentUser, currentConversationId, updateConversation])

  const llmChatContext = useMemo((): LlmChatContextType => ({
    currentConversationId,
    conversations,
    submitMessage,
    // resetConversation,
    switchConversation,
    archiveConversation,
    loading,
    setLoading
  }), [submitMessage, conversations, currentConversationId, switchConversation, archiveConversation, loading, setLoading]);


  if (!currentUser) {
    return <>
    {children}
    </>;
  }

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
