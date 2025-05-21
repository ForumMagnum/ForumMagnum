import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { useMulti } from '@/lib/crud/withMulti';
import { useCurrentUser } from '../common/withUser';
import sortBy from 'lodash/sortBy';
import { useSingle } from '@/lib/crud/withSingle';
import { useUpdate } from '@/lib/crud/withUpdate';
import keyBy from 'lodash/keyBy';
import { randomId } from '@/lib/random';
import { z } from 'zod';
import markdownIt from "markdown-it";
import markdownItContainer from "markdown-it-container";
import markdownItFootnote from "markdown-it-footnote";
import markdownItSub from "markdown-it-sub";
import markdownItSup from "markdown-it-sup";

// FIXME This is a copy-paste of a markdown config from conversionUtils that has gotten out of sync
const mdi = markdownIt({ linkify: true });
// mdi.use(markdownItMathjax()) // for performance, don't render mathjax
mdi.use(markdownItContainer as AnyBecauseHard, "spoiler");
mdi.use(markdownItFootnote);
mdi.use(markdownItSub);
mdi.use(markdownItSup);

export const RAG_MODE_SET = ['Auto', 'None', 'CurrentPost', 'Search', 'Provided'] as const;
export type RagModeType = typeof RAG_MODE_SET[number];

const ClientMessageSchema = z.object({
  conversationId: z.string().nullable(),
  userId: z.string(),
  content: z.string(),
});

const PromptContextOptionsSchema = z.object({
  ragMode: z.enum(RAG_MODE_SET),
  postId: z.string().optional(),
  includeComments: z.boolean().optional(),
  postContext: z.optional(z.union([z.literal('post-page'), z.literal('post-editor')])),
});

export const ClaudeMessageRequestSchema = z.object({
  newMessage: ClientMessageSchema,
  promptContextOptions: PromptContextOptionsSchema,
  newConversationChannelId: z.string().optional(),
});

export type ClientMessage = z.infer<typeof ClientMessageSchema>;
export type PromptContextOptions = z.infer<typeof PromptContextOptionsSchema>;
export type ClaudeMessageRequest = z.infer<typeof ClaudeMessageRequestSchema>;

type LlmStreamContent = {
  conversationId: string;
  content: string;
};

type LlmStreamChunk = {
  conversationId: string;
  chunk: string;
};

type LlmStreamError = {
  conversationId: string;
  error: string;
};

type LlmStreamEnd = {
  conversationId: string;
};

export type LlmCreateConversationMessage = {
  eventType: 'llmCreateConversation';
  title: string;
  conversationId: string;
  /** Stringified date */
  createdAt: string;
  userId: string;
  channelId: string;
}

export type LlmStreamContentMessage = {
  eventType: 'llmStreamContent',
  data: LlmStreamContent
};

export type LlmStreamChunkMessage = {
  eventType: 'llmStreamChunk',
  data: LlmStreamChunk
};

export type LlmStreamErrorMessage = {
  eventType: 'llmStreamError',
  data: LlmStreamError
};

export type LlmStreamEndMessage = {
  eventType: 'llmStreamEnd',
  data: LlmStreamEnd
};

export type LlmStreamMessage = LlmCreateConversationMessage | LlmStreamContentMessage | LlmStreamChunkMessage | LlmStreamErrorMessage | LlmStreamEndMessage;

export type NewLlmMessage = Pick<LlmMessagesFragment, 'userId' | 'content'> & {
  role: LlmMessagesFragment['role'] | 'error';
  conversationId?: string;
  buffer?: string;
};

type PreSaveLlmMessage = Omit<NewLlmMessage, 'role'>;

type NewLlmConversation = Pick<LlmConversationsWithMessagesFragment, 'userId' | 'createdAt' | 'lastUpdatedAt'> & {
  _id: string;
  title?: string;
  messages: NewLlmMessage[];
};

type LlmConversationWithPartialMessages = LlmConversationsFragment & {
  messages: Array<LlmMessagesFragment | NewLlmMessage>;
};

type LlmConversation = NewLlmConversation | LlmConversationWithPartialMessages;
type LlmConversationsDict = Record<string, LlmConversation>;

interface SubmitMessageArgs {
  query: string;
  ragMode: RagModeType;
  currentPostId?: string;
  postContext?: PromptContextOptions['postContext']
}

interface LlmChatContextType {
  orderedConversations: LlmConversation[];
  currentConversation?: LlmConversation;
  currentConversationLoading: boolean;
  submitMessage: (args: SubmitMessageArgs) => void;
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

  const { mutate: updateConversation } = useUpdate({
    collectionName: "LlmConversations",
    fragmentName: "LlmConversationsFragment"
  })

  const { results: userLlmConversations } = useMulti({
    collectionName: "LlmConversations",
    fragmentName: "LlmConversationsFragment",
    terms: { view: "llmConversationsWithUser", userId: currentUser?._id, limit: 50 }, //TODO: Figure out what to do when people have many conversations
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
    return sortBy(llmConversationsList, (conversation) => conversation.lastUpdatedAt ?? conversation.createdAt);
  }, [conversations]);

  const [currentConversationId, setCurrentConversationId] = useState<string>();

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
    setLoadingConversationIds((loadingConversationIds) => {
      const conversationInLoadingState = loadingConversationIds.includes(conversationId);
      let updatedLoadingConversationIds: string[] | undefined = undefined;
      if (loading && !conversationInLoadingState) {
        updatedLoadingConversationIds = [...loadingConversationIds, conversationId];
      } else if (!loading && conversationInLoadingState) {
        updatedLoadingConversationIds = loadingConversationIds.filter(id => conversationId !== id);
      }
  
      if (updatedLoadingConversationIds) {
        return updatedLoadingConversationIds;
      } else {
        return loadingConversationIds;
      }
    });
  }, []);

  const hydrateNewConversation = useCallback((newConversationEvent: LlmCreateConversationMessage) => {
    const { title, conversationId, createdAt, userId, channelId } = newConversationEvent;
    setConversations((conversations) => {
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
  
      return { [conversationId]: hydratedConversation, ...rest };
    });

    setCurrentConversationId(conversationId);
    setConversationLoadingState(conversationId, true);
  }, [setConversationLoadingState]);

  const handleLlmStreamChunk = useCallback((message: LlmStreamChunkMessage) => {
    if (!currentUser) {
      return;
    }

    const { conversationId, chunk } = message.data;

    setConversations((conversations) => {
      const streamConversation = conversations[conversationId];
      const updatedMessages = [...streamConversation.messages];
      const lastMessageInConversation = updatedMessages.slice(-1)[0];
      const lastClientMessageIsAssistant = lastMessageInConversation?.role === 'assistant';

      // We need to buffer the unparsed chunks, since every time we parse the in-progress message we get html which can't be appended-to in a sane way
      // Then, each time we get a new chunk, we parse the full buffer
      // `handleLlmStreamContent` gets the final message when the whole thing is done, which might differ slightly since we also do some server-side LaTeX handling that we can't do on the client
      let newBuffer;
      if (lastClientMessageIsAssistant && 'buffer' in lastMessageInConversation) {
        newBuffer = (lastMessageInConversation.buffer ?? '') + chunk;
      } else {
        newBuffer = chunk;
      }

      const parsedContent = mdi.render(newBuffer, { docId: randomId() });
  
      const newMessage: NewLlmMessage = { 
        conversationId,
        userId: currentUser._id,
        // TODO: pass back role through stream?
        role: "assistant", 
        content: parsedContent,
        buffer: newBuffer,
      };
      
      // If the last message is an assistant message, then we're appending to it
      // That means we need to replace it in the conversation's messages array instead of appending a new one
      if (lastClientMessageIsAssistant) {
        updatedMessages.pop();
      }
      updatedMessages.push(newMessage);
  
      const updatedConversation: LlmConversation = { ...streamConversation, deleted: false };
      updatedConversation.messages = updatedMessages;
      
      return { ...conversations, [updatedConversation._id]: updatedConversation };
    });

    setConversationLoadingState(conversationId, false);
  }, [currentUser, setConversationLoadingState]);
  
  const handleLlmStreamContent = useCallback((message: LlmStreamContentMessage) => {
    if (!currentUser) {
      return;
    }

    const { conversationId, content } = message.data;

    setConversations((conversations) => {
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
      
      // Since we're sending an aggregate buffer rather than diffs, we need to replace the last message in the conversation each time we get one (after the first time)
      if (lastClientMessageIsAssistant) {
        updatedMessages.pop();
      }
      updatedMessages.push(newMessage);
  
      const updatedConversation = { ...streamConversation };
      updatedConversation.messages = updatedMessages;
      
      return { ...conversations, [updatedConversation._id]: updatedConversation };
    });

    setConversationLoadingState(conversationId, false);
  }, [currentUser, setConversationLoadingState]);

  const handleLlmStreamError = useCallback((message: LlmStreamErrorMessage) => {
    if (!currentUser) {
      return;
    }

    const { conversationId, error } = message.data;

    setConversations((conversations) => {
      const streamConversation = conversations[conversationId];
      const updatedMessages = [...streamConversation.messages];

      const newMessage: NewLlmMessage = {
        conversationId,
        userId: currentUser?._id,
        role: "error",
        content: error
      };

      updatedMessages.push(newMessage);
      const updatedConversation = { ...streamConversation };
      updatedConversation.messages = updatedMessages;

      return { ...conversations, [updatedConversation._id]: updatedConversation };
    });

    setConversationLoadingState(conversationId, false);
  }, [currentUser, setConversationLoadingState]);

  const handleClaudeResponseMesage = useCallback((message: LlmStreamMessage) => {
    switch (message.eventType) {
      case "llmCreateConversation":
        hydrateNewConversation(message);
        break;
      case "llmStreamContent":
        handleLlmStreamContent(message);
        break;
      case "llmStreamChunk":
        handleLlmStreamChunk(message);
        break;
      case "llmStreamError":
        handleLlmStreamError(message);
        break;
      case "llmStreamEnd":
        setConversationLoadingState(message.data.conversationId, false);
        break;
    }
  }, [hydrateNewConversation, handleLlmStreamContent, handleLlmStreamChunk, handleLlmStreamError, setConversationLoadingState]);
  
  const sendClaudeMessage = useCallback(async ({newMessage, promptContextOptions, newConversationChannelId}: {
    newMessage: ClientMessage,
    promptContextOptions: PromptContextOptions,
    newConversationChannelId?: string
  }) => {
    const response = await fetch("/api/sendLlmChat", {
      method: "POST",
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ newMessage, promptContextOptions, newConversationChannelId }),
    });
    if (!response.ok) {
      let errorMessage;
      try {
        errorMessage = await response.text();
      } catch (err) {
        // eslint-disable-next-line no-console
        console.log(err);
        errorMessage = 'Unknown error when sending message.';
      }

      handleLlmStreamError({
        eventType: 'llmStreamError',
        data: {
          conversationId: (newMessage.conversationId ?? newConversationChannelId)!,
          error: errorMessage
        }
      });

      return;
    }
    if (!response.body) {
      handleLlmStreamError({
        eventType: 'llmStreamError',
        data: {
          conversationId: (newMessage.conversationId ?? newConversationChannelId)!,
          error: 'Missing response body for unknown reasons'
        }
      });

      return;
    }
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    // eslint-disable-next-line no-constant-condition
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      let boundary;
      while ((boundary = buffer.indexOf('\n\n')) !== -1) {
        const line = buffer.slice(0, boundary);
        buffer = buffer.slice(boundary + 2);

        if (line.startsWith('data: ')) {
          let message: LlmStreamMessage | null = null;
          try {
            message = JSON.parse(line.slice("data: ".length));
          } catch (error) {
            // eslint-disable-next-line no-console
            console.error('Error parsing JSON:', error);
          }
          if (message) {
            handleClaudeResponseMesage(message);
          }
        }
      }
    }
    // Handle any remaining data in the buffer
    if (buffer.startsWith('data: ')) {
      let message: LlmStreamMessage|null = null
      try {
        message = JSON.parse(buffer.slice("data: ".length));
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Error parsing JSON:', error);
      }
      if (message) {
        handleClaudeResponseMesage(message);
      }
    }
    
  }, [handleClaudeResponseMesage, handleLlmStreamError]);

  // TODO: Ensure code is sanitized against injection attacks
  const submitMessage = useCallback(async ({ query, ragMode, currentPostId, postContext }: SubmitMessageArgs) => {
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
    const preSaveMessage = {
      conversationId: currentConversation?._id,
      userId: currentUser._id,
      content: query
    };

    setConversations((conversations) => {
      // We don't send the role to the server
      const newClientMessage: NewLlmMessage = { ...preSaveMessage, role: 'user' };
      const updatedMessages = [...displayedConversation.messages ?? [], newClientMessage];
      const conversationWithNewUserMessage: LlmConversation = { ...displayedConversation };
      conversationWithNewUserMessage.messages = updatedMessages;

      return { ...conversations, [conversationWithNewUserMessage._id]: conversationWithNewUserMessage };
    });


    // Update Client Display
    setConversationLoadingState(displayedConversation._id, true);

    if (!isExistingConversation) {
      setCurrentConversationId(newConversationChannelId);
    }

    const promptContextOptions: PromptContextOptions = {
      postId: currentPostId,
      ragMode,
      /* TODO: this currently doesn't do anything; it's hardcoded on the server */
      includeComments: true,
      postContext,
    };

    void sendClaudeMessage({
      newMessage: {
        ...preSaveMessage,
        conversationId: preSaveMessage.conversationId ?? null,
      },
      promptContextOptions,
      ...(isExistingConversation ? {} : { newConversationChannelId }),
    });
  }, [currentUser, currentConversation, sendClaudeMessage, setConversationLoadingState]);

  const setCurrentConversation = useCallback(setCurrentConversationId, [setCurrentConversationId]);

  const archiveConversation = useCallback(async (conversationId: string) => {
    if (!currentUser) {
      return;
    }

    if (currentConversationId === conversationId) {
      setCurrentConversationId(undefined);
    }

    // remove conversation with this id from conversations object
    setConversations((conversations) => {
      const { [conversationId]: _, ...rest } = conversations;
      return rest;
    });

    void updateConversation({
      selector: { _id: conversationId },
      data: {
        deleted: true
      }
    })
  }, [currentUser, currentConversationId, updateConversation]);

  useEffect(() => {
    if (currentConversationWithMessages) {
      setConversations((conversations) => {
        const clientSideConversationState = conversations[currentConversationWithMessages._id];
        if (currentConversationWithMessages.messages.length > clientSideConversationState.messages.length) {
          return { ...conversations, [currentConversationWithMessages._id]: currentConversationWithMessages };
        }

        return conversations;
      });
    }
  }, [currentConversationWithMessages]);

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

export default registerComponent("LlmChatWrapper", LlmChatWrapper);


