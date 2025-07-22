import uniq from "lodash/uniq";
import { getAnthropicClientOrThrow, getAnthropicPromptCachingClientOrThrow } from "../languageModels/anthropicClient";
import { getEmbeddingsFromApi } from "../embeddings";
import { postGetPageUrl } from "@/lib/collections/posts/helpers";
import { generateContextSelectionPrompt, CLAUDE_CHAT_SYSTEM_PROMPT, generateTitleGenerationPrompt, generateAssistantContextMessage, 
  CONTEXT_SELECTION_SYSTEM_PROMPT, contextSelectionResponseFormat, LlmPost, BasePromptArgs } from "../languageModels/promptUtils";
import { userHasLlmChat } from "@/lib/betas";
import { PromptCachingBetaMessageParam, PromptCachingBetaTextBlockParam } from "@anthropic-ai/sdk/resources/beta/prompt-caching/messages";
import { userGetDisplayName } from "@/lib/collections/users/helpers";
import type { LlmCreateConversationMessage, LlmStreamChunkMessage, LlmStreamContentMessage, 
  LlmStreamEndMessage, LlmStreamErrorMessage, LlmStreamMessage } from "@/components/languageModels/LlmChatWrapper";
import { ClaudeMessageRequestSchema, ClientMessage, RagModeType, PromptContextOptions, ClaudeMessageRequest } from "@/components/languageModels/schema";
import { LlmVisibleMessageRole, UserVisibleMessageRole, llmVisibleMessageRoles } from "@/lib/collections/llmMessages/newSchema";
import { asyncMapSequential } from "@/lib/utils/asyncUtils";
import { markdownToHtml, htmlToMarkdown } from "../editor/conversionUtils";
import { getOpenAI } from "../languageModels/languageModelIntegration";
import express, { Express } from "express";
import { captureException } from "@sentry/core";
import { getContextFromReqAndRes } from "../vulcan-lib/apollo-server/context";
import { runQuery } from "../vulcan-lib/query";
import { createLlmConversation } from "../collections/llmConversations/mutations";
import { createLlmMessage } from "../collections/llmMessages/mutations";
import { gql } from "@/lib/generated/gql-codegen";

interface InitializeConversationArgs {
  newMessage: ClientMessage;
  systemPrompt: string;
  model: string;
  currentUser: DbUser;
  context: ResolverContext;
  currentPostId?: string;
  ragMode: RagModeType;
  postContext?: PromptContextOptions['postContext']
}

interface CreateNewConversationArgs {
  query: string;
  systemPrompt: string;
  model: string;
  currentUser: DbUser;
  currentPost: LlmPost | null;
  postContext?: PromptContextOptions['postContext']
  context: ResolverContext;
}

type ConversationContext = {
  newConversationChannelId: string;
  type: 'new';
} | {
  conversationId: string;
  type: 'existing';
};

interface ClaudeAllowableMessage {
  content: string;
  role: LlmVisibleMessageRole;
}

interface NewLlmMessage {
  userId: string;
  content: string;
  role: LlmVisibleMessageRole|UserVisibleMessageRole
  conversationId: string;
}

interface SendMessagesToClaudeArgs {
  newMessages: DbLlmMessage[];
  previousMessages: DbLlmMessage[];
  context: ResolverContext;
  conversationId: string;
  model: string;
  currentUser: DbUser;
}

interface GetPostWithContentsArgs {
  postId: string;
  postContext?: PromptContextOptions['postContext'];
  context: ResolverContext;
}

interface GetContextMessageArgs {
  content: string;
  currentPost: LlmPost | null;
  postContext?: PromptContextOptions['postContext'];
  ragMode: RagModeType;
  context: ResolverContext;
}

// a type for kind of context to use that's a value of "query-based", "post-based", or "both"
type RagContextType = "query-based" | "current-post-only" | "current-post-and-search" | "both" | "none" | "error"

function getConversationContext(newConversationChannelId: string | undefined, newMessage: ClientMessage): ConversationContext {
  return newConversationChannelId ? {
    newConversationChannelId,
    type: 'new',
  } : {
    conversationId: newMessage.conversationId!,
    type: 'existing',
  };
}

async function getQueryContextDecision(args: BasePromptArgs): Promise<RagContextType> {
  const openai = await getOpenAI();
  if (!openai) {
    return 'error';
  }

  // TODO: come back to this when haiku 3.5 is out to replace it, maybe
  const toolUseResponse = await openai.beta.chat.completions.parse({
    model: 'gpt-4o-mini-2024-07-18',
    messages: [
      { role: 'system', content: CONTEXT_SELECTION_SYSTEM_PROMPT },
      { role: 'user', content: generateContextSelectionPrompt(args) }
    ],
    // tools: [contextSelectionTool],
    response_format: contextSelectionResponseFormat
  });

  const parsedResponse = toolUseResponse.choices[0].message.parsed;
  if (!parsedResponse) {
    // eslint-disable-next-line no-console
    console.log('Context selection response seems to be missing tool use arguments', { toolUseResponse: JSON.stringify(toolUseResponse, null, 2) });
    return 'error';
  }

  return parsedResponse.strategy_choice;
}

async function getProvidedPosts(query: string, context: ResolverContext): Promise<PostsPage[]> {
  const postIdRegex = /\/([a-zA-Z0-9]{17})(?=[/#?&)]|$)/g;
  const postIdMatches = [];
  let match;
  while ((match = postIdRegex.exec(query)) !== null) {
    postIdMatches.push(match[1]);
  }

  const postIds = uniq(postIdMatches);
  const posts = await getPostsWithContents(postIds, context);

  return posts;
}

const ragModeMapping = {
  'CurrentPost': 'current-post-only',
  'Search': 'both',
  'None': 'none',
  // 'Recommendation': 'recommendation',
  'Provided': 'provided',
  // 'Rationality Tutor': 'rationality-tutor',
}

// TODO: come back and refactor the query context decision to actually use the embedding distance results (including the post titles)
async function getContextualPosts({ content: query, ragMode, currentPost, postContext, context }: GetContextMessageArgs): Promise<LlmPost[]> {


  const contextSelectionCode = (ragMode === 'Auto')
    ? await getQueryContextDecision({ query, postContext, currentPost })
    : ragModeMapping[ragMode];

  const useQueryEmbeddings = ['query-based', 'both'].includes(contextSelectionCode);
  const useCurrentPost = ['current-post-only', 'current-post-and-search', 'both'].includes(contextSelectionCode);
  const useCurrentPostSearchEmbeddings = ['current-post-and-search', 'both'].includes(contextSelectionCode);


  const { embeddings: queryEmbeddings } = await getEmbeddingsFromApi(query);

  const querySearchPromise = useQueryEmbeddings
    ? context.repos.postEmbeddings.getNearestPostIdsWeightedByQuality(queryEmbeddings, contextSelectionCode==='query-based' ? 10 : 3)
    : Promise.resolve([]);

  const currentPostSearchPromise = useCurrentPostSearchEmbeddings && currentPost
    ? context.repos.postEmbeddings.getNearestPostIdsWeightedByQualityByPostId(currentPost._id, 10)
    : Promise.resolve([]);

  const [querySearchIds, currentPostSearchIds] = await Promise.all([
    querySearchPromise,
    currentPostSearchPromise,
  ]);

  const deduplicatedSearchResultIds = uniq([...querySearchIds, ...currentPostSearchIds]);

  // TODO: Clean up somehow. This is kind of ugly but this is where the decision is being made about whether or not to use the current post in the context window.
  const posts: LlmPost[] = await getPostsWithContents(deduplicatedSearchResultIds, context);
  if (useCurrentPost && currentPost && !deduplicatedSearchResultIds.includes(currentPost._id)) {
    posts.unshift(currentPost);
  }
  return posts;
};

async function getConversationTitle(args: BasePromptArgs) {
  const titleGenerationPrompt = generateTitleGenerationPrompt(args);

  const client = getAnthropicClientOrThrow()
  const titleResult = await client.messages.create({
    model: "claude-3-haiku-20240307",
    max_tokens: 50,
    messages: [{role: "user", content: titleGenerationPrompt}]
  })

  const titleResponse = titleResult.content[0]
  if (titleResponse.type === 'tool_use') {
    throw new Error("Invalid tool_use response when generating title")
  }

  return titleResponse.text
}

async function createNewConversation({ query, systemPrompt, model, currentUser, context, postContext, currentPost }: CreateNewConversationArgs): Promise<DbLlmConversation> {
  const title = await getConversationTitle({ query, currentPost });

  const newConversation = await createLlmConversation({
    data: {
      title,
      systemPrompt,
      model,
      userId: currentUser._id,
    }
  }, context);

  return newConversation;
};

function getPostContextMessage(postsLoadedIntoContext: LlmPost[], currentPost: LlmPost | null): string {

  const postsList = postsLoadedIntoContext.map((post) => {
    const author = userGetDisplayName(post.user)
    return  `- *[${post?.title}](${postGetPageUrl(post)}) by ${author}*`}
  ).join("\n");

  const message = [
    `*Based on your query, the following posts were loaded into the LLM's context window*:`,
    postsList,
    `\n*(This message and similar messages are not sent to the LLM.)*`
  ].join("\n");

  return message;
}

async function sendNewConversationEvent(conversationContext: ConversationContext, conversation: DbLlmConversation, currentUser: DbUser, sendEventToClient: (event: LlmStreamMessage) => Promise<void>) {
  if (conversationContext.type === 'new') {
    const newConversationEvent: LlmCreateConversationMessage = {
      eventType: 'llmCreateConversation',
      title: conversation.title,
      conversationId: conversation._id,
      createdAt: conversation.createdAt.toISOString(),
      userId: currentUser._id,
      channelId: conversationContext.newConversationChannelId,
    };

    return sendEventToClient(newConversationEvent);
  }
}

async function sendStreamContentEvent({conversationId, messageBuffer, sendEventToClient}: {
  conversationId: string,
  messageBuffer: string,
  sendEventToClient: (event: LlmStreamMessage) => Promise<void>
}) {
  const parsedMessageBuffer = await markdownToHtml(messageBuffer);

  const streamContentEvent: LlmStreamContentMessage = {
    eventType: 'llmStreamContent',
    data: {
      content: parsedMessageBuffer,
      conversationId,
    },
  };

  return sendEventToClient(streamContentEvent);
}

async function sendStreamChunkEvent({conversationId, chunk, sendEventToClient}: {
  conversationId: string,
  chunk: string,
  sendEventToClient: (event: LlmStreamMessage) => Promise<void>
}) {
  const streamChunkEvent: LlmStreamChunkMessage = {
    eventType: 'llmStreamChunk',
    data: {
      chunk,
      conversationId,
    },
  };

  return sendEventToClient(streamChunkEvent);
}

async function sendStreamEndEvent(conversationId: string, sendEventToClient: (event: LlmStreamMessage) => Promise<void>) {
  const streamEndEvent: LlmStreamEndMessage = {
    eventType: 'llmStreamEnd',
    data: { conversationId },
  };

  return sendEventToClient(streamEndEvent);
}

async function sendStreamErrorEvent(conversationId: string, errorMessage: string | undefined, sendEventToClient: (event: LlmStreamMessage) => Promise<void>) {
  const errorEvent: LlmStreamErrorMessage = {
    eventType: 'llmStreamError',
    data: {
      conversationId,
      error: errorMessage ?? 'Unknown error sending message'
    }
  };

  await sendEventToClient(errorEvent);  
}

function convertMessageRoleForClaude(role: LlmVisibleMessageRole) {
  switch (role) {
    case 'user':
    case 'assistant-context':
      return 'user';

    case 'assistant':
    case 'lw-assistant':
      return 'assistant';
  }
}

function createClaudeMessage(message: ClaudeAllowableMessage, cache?: boolean): PromptCachingBetaMessageParam {
  const content: Array<PromptCachingBetaTextBlockParam> = [{
    type: 'text',
    text: message.content,
    ...(cache ? {cache_control: {type: "ephemeral"}} : undefined)
  }];

  return {
    role: convertMessageRoleForClaude(message.role),
    content,
  }
}

function isClaudeAllowableMessage<T extends { role: DbLlmMessage['role'], content: string }>(message: T): message is T & ClaudeAllowableMessage {
  return llmVisibleMessageRoles.has(message.role);
}

async function sendMessagesToClaude({ previousMessages, newMessages, conversationId, model, currentUser, sendEventToClient }: SendMessagesToClaudeArgs & {
  sendEventToClient: (event: LlmStreamMessage) => Promise<void>
}) {
  const promptCachingClient = getAnthropicPromptCachingClientOrThrow();

  const conversationMessages = [...previousMessages, ...newMessages];
  const messagesForClaude = conversationMessages.filter(isClaudeAllowableMessage);
  const preparedMessages = messagesForClaude.map((message, idx) => createClaudeMessage(message, idx === 0));

  const stream = promptCachingClient.messages.stream({
    model,
    system: CLAUDE_CHAT_SYSTEM_PROMPT,
    max_tokens: 4096,
    messages: preparedMessages,
  });

  const writeEventPromises: Array<Promise<void>> = [];

  stream.on('text', async (text) => {
    const writeEventPromise = sendStreamChunkEvent({ conversationId, chunk: text, sendEventToClient });
    writeEventPromises.push(writeEventPromise);
  });

  // In production, we seemed to often be missing the last few chunks of the message.
  // This tries to ensure that we've finished writing all the messages to the client before we call res.end(), later
  // Even if it turns out that `end` being emitted can cause this to run before the last `text` promise gets pushed into the array,
  // we still end up awaiting the full-message event at the end before resolving this, so it should end up fine on the client.
  return new Promise<Partial<DbInsertion<DbLlmMessage>>>((resolve) => {
    stream.on('end', async () => {
      const [finalMessage] = await Promise.all([
        stream.finalMessage(),
        Promise.allSettled(writeEventPromises)
      ]);

      const response = finalMessage.content[0];
      if (response.type === 'tool_use') {
        throw new Error("Invalid tool_use response when responding to message");
      }
    
      const newResponse = {
        conversationId,
        userId: currentUser._id,
        role: "assistant" as const,
        content: response.text,
      };

      await sendStreamContentEvent({ conversationId, messageBuffer: response.text, sendEventToClient });
    
      resolve(newResponse);
    });
  });
}

const draftPostQuery = gql(`
  query singleDraftPostForLLMQuery($input: SinglePostInput, $version: String) {
    post(input: $input) {
      result {
        ...PostsEditQueryFragment
      }
    }
  }
`);

const publishedPostQuery = gql(`
  query singlePublishedPostForLLMQuery($input: SinglePostInput) {
    post(input: $input) {
      result {
        ...PostsPage
      }
    }
  }
`);

const postsMultiQuery = gql(`
  query multiPostsForLLMQuery($input: MultiPostInput) {
    posts(input: $input) {
      results {
        ...PostsPage
      }
    }
  }
`);

async function getPostWithContents({ postId, postContext, context }: GetPostWithContentsArgs): Promise<LlmPost | null> {
  const resolverArgs = postContext === 'post-editor'
    ? { extraVariables: { version: 'String' }, extraVariablesValues: { version: 'draft' } } as const
    : {};

  const query = postContext === 'post-editor'
    ? draftPostQuery
    : publishedPostQuery;

  const { data } = await runQuery(query, {
    input: { selector: { documentId: postId }, resolverArgs: resolverArgs.extraVariablesValues },
    ...resolverArgs.extraVariablesValues
  }, context);

  return data?.post?.result ?? null;
}

async function getPostsWithContents(postIds: string[], context: ResolverContext): Promise<LlmPost[]> {
  const { data } = await runQuery(postsMultiQuery, {
    input: { terms: { postIds } }
  }, context);

  return data?.posts?.results?.filter((post) => !!post) ?? [];
}

async function getContextMessages({ content, ragMode, currentPost, postContext, context }: GetContextMessageArgs) {
  if (['None', 'Recommendation'].includes(ragMode)) {
    return {
      userContextMessage: '',
      assistantContextMessage: '',
      contextualPosts: [],
      providedPosts: [],
    };
  }

  const [providedPosts, contextualPosts] = await Promise.all([
    getProvidedPosts(content, context),
    getContextualPosts({ content, ragMode, currentPost, postContext, context })
  ]);
  const assistantContextMessage = await generateAssistantContextMessage({query: content, currentPost, postContext,providedPosts, contextualPosts, includeComments: true, context});
  const userContextMessage = getPostContextMessage([...providedPosts, ...contextualPosts], currentPost);

  return { userContextMessage, assistantContextMessage, providedPosts, contextualPosts };
}

async function createConversationWithMessages({ newMessage, systemPrompt, model, currentPostId, ragMode, postContext, currentUser, context }: InitializeConversationArgs) {
  const { content: query, userId } = newMessage;

  const currentPost = await (currentPostId
    ? getPostWithContents({ postId: currentPostId, postContext, context })
    : Promise.resolve(null)
  );

  const [conversation, { userContextMessage, assistantContextMessage, contextualPosts, providedPosts }] = await Promise.all([
    createNewConversation({
      query,
      systemPrompt,
      model,
      currentUser,
      context,
      currentPost,
    }),
    getContextMessages({ content: query, ragMode, currentPost, context })
  ]);

  const conversationId = conversation._id;

  // The user's actual message
  const newUserMessageRecord = {
    userId,
    content: query,
    role: 'user',
    conversationId,
  } as const;


  if (ragMode === 'None') {
    return {
      conversation,
      newMessageRecords: [newUserMessageRecord]
    };
  }

  // The message sent to Claude with all of the loaded context
  const newAssistantContextMessageRecord = {
    userId,
    content: assistantContextMessage,
    role: 'assistant-context',
    conversationId,
  } as const;

  // The `assistant-context` message above gets converted to a `user` role message and sent to Claude.
  // However, we can't send multiple `user` messages in a row, so we need to insert an `assistant` message in between the context and the actual user query.
  const newAssistantAckMessageRecord = {
    userId,
    // TODO: fix up content here, maybe
    content: 'Acknowledged.',
    role: 'lw-assistant',
    conversationId,
  } as const;


  // The "message" we show to the user with a summary of the loaded context, but isn't sent to Claude
  const newUserContextMessageRecord = {
    userId,
    content: userContextMessage,
    role: 'user-context',
    conversationId,
  } as const;

  const newMessageRecords: NewLlmMessage[] = [newAssistantContextMessageRecord, newAssistantAckMessageRecord, newUserMessageRecord]

  if (contextualPosts.length > 0 || providedPosts.length > 0) {
    newMessageRecords.push(newUserContextMessageRecord);
  }

  return {
    conversation,
    newMessageRecords
  };
}


async function prepareMessagesForConversation({ newMessage, conversationId, context }: {
  newMessage: ClientMessage;
  conversationId: string;
  context: ResolverContext;
}) {
  const conversation = await context.loaders.LlmConversations.load(conversationId);
  if (!conversation) {
    throw new Error(`Couldn't find a conversation with id ${conversationId}`);
  }

  const newUserMessageRecord = { ...newMessage, role: 'user', conversationId } as const;

  return {
    conversation,
    newMessageRecords: [newUserMessageRecord],
  };
}

export async function sendLlmChatHandler({
  parsedBody,
  currentUser,
  context,
  sendEventToClient
}: {
  parsedBody: ClaudeMessageRequest;
  currentUser: DbUser;
  context: ResolverContext;
  sendEventToClient: (event: LlmStreamMessage) => Promise<void>;
}) {
  const { newMessage, promptContextOptions, newConversationChannelId } = parsedBody;    
  const { postId: currentPostId, ragMode, postContext } = promptContextOptions;

  const conversationContext = getConversationContext(newConversationChannelId, newMessage);

  const model = 'claude-3-5-sonnet-20240620';
  // TODO: Probably should be output by new conversation function
  const systemPrompt = CLAUDE_CHAT_SYSTEM_PROMPT;
  
  // TODO: also figure out if we want prevent users from creating new conversations with multiple pre-filled messages

  const { conversation, newMessageRecords } = conversationContext.type === 'new'
    ? await createConversationWithMessages({ newMessage, systemPrompt, model, currentPostId, ragMode, postContext, currentUser, context })
    : await prepareMessagesForConversation({ newMessage, conversationId: conversationContext.conversationId, context });

  const conversationId = conversation._id;

  const now = new Date();
  const fetchPreviousMessagesPromise = context.LlmMessages.find({ conversationId, role: { $in: [...llmVisibleMessageRoles] }, createdAt: { $lt: now } }, { sort: { createdAt: 1 } }).fetch();

  const createNewMessagesSequentiallyPromise = asyncMapSequential(
    newMessageRecords,
    (message) => {
      return createLlmMessage({ data: message }, context);
    }
  );

  const [previousMessages, newMessages] = await Promise.all([
    fetchPreviousMessagesPromise,
    createNewMessagesSequentiallyPromise,
  ]);

  try {
    // TODO: figure out if we can relocate this to be earlier by fixing the thing on the client where we refetch the latest conversation
    // which will be missing the latest messages, if we haven't actually inserted them into the database (which we do above)
    await sendNewConversationEvent(conversationContext, conversation, currentUser, sendEventToClient);
    
    const claudeResponse = await sendMessagesToClaude({
      previousMessages,
      newMessages,
      conversationId,
      model,
      currentUser,
      context,
      sendEventToClient
    });

    await createLlmMessage({ data: claudeResponse }, context);
    
    await sendStreamEndEvent(conversationId, sendEventToClient);
  } catch (err) {
    captureException(err);
    await sendStreamErrorEvent(conversationId, err.message, sendEventToClient);
    throw err;
  }
}

export function addLlmChatEndpoint(app: Express) {
  app.use("/api/sendLlmChat", express.json());
  app.post("/api/sendLlmChat", async (req, res) => {
    const context = await getContextFromReqAndRes({req, isSSR: false});
    const currentUser = context.currentUser;
    if (!userHasLlmChat(currentUser)) {
      return res.status(403).send('Only admins and authorized users can use Claude chat right now');
    }

    const parsedBody = ClaudeMessageRequestSchema.safeParse(req.body);

    if (!parsedBody.success) {
      return res.status(400).send('Invalid request body');
    }

    const { newMessage, promptContextOptions, newConversationChannelId } = parsedBody.data;    
    const { postId: currentPostId, ragMode, postContext } = promptContextOptions;
    
    if (!newConversationChannelId && !newMessage.conversationId) {
      return res.status(400).send('Message must either be part of an existing conversation, or a new conversation channel id needs to be provided');
    }

    if (newConversationChannelId && newMessage.conversationId) {
      return res.status(400).send('Cannot create a new conversation for a message sent for an existing conversationId');
    }

    if (newMessage.content.trim().length === 0) {
      return res.status(400).send('Message must contain non-whitespace content');
    }

    try {
      const markdown = htmlToMarkdown(newMessage.content);
      newMessage.content = markdown;
    } catch (err) {
      res.status(500).send(err.message ?? 'Unknown error when parsing message');
    }

    // Check again post-markdown conversion, in case we got a set of html tags that resulted in an empty string
    if (newMessage.content.trim().length === 0) {
      return res.status(400).send('Message must contain non-whitespace content');
    }

    const conversationContext = getConversationContext(newConversationChannelId, newMessage);

    if (conversationContext.type === 'existing') {
      const conversation = await context.loaders.LlmConversations.load(conversationContext.conversationId);
      if (conversation?.userId !== currentUser._id) {
        return res.status(404).send(`Could not find user's conversation`);
      }
    }

    const model = 'claude-3-5-sonnet-20240620';
    // TODO: Probably should be output by new conversation function
    const systemPrompt = CLAUDE_CHAT_SYSTEM_PROMPT;
    
    // TODO: also figure out if we want prevent users from creating new conversations with multiple pre-filled messages

    const { conversation, newMessageRecords } = conversationContext.type === 'new'
      ? await createConversationWithMessages({ newMessage, systemPrompt, model, currentPostId, ragMode, postContext, currentUser, context })
      : await prepareMessagesForConversation({ newMessage, conversationId: conversationContext.conversationId, context });

    const conversationId = conversation._id;

    const now = new Date();
    const fetchPreviousMessagesPromise = context.LlmMessages.find({ conversationId, role: { $in: [...llmVisibleMessageRoles] }, createdAt: { $lt: now } }, { sort: { createdAt: 1 } }).fetch();

    const createNewMessagesSequentiallyPromise = asyncMapSequential(
      newMessageRecords,
      (message) => {
        return createLlmMessage({ data: message }, context);
      }
    );

    const [previousMessages, newMessages] = await Promise.all([
      fetchPreviousMessagesPromise,
      createNewMessagesSequentiallyPromise,
    ]);

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    });

    let isResponseEnded = false;

    res.on('close', () => {
      isResponseEnded = true;
    });  

    async function sendEventToClient(event: LlmStreamMessage): Promise<void> {
      return new Promise((resolve, reject) => {
        if (isResponseEnded) {
          resolve();
          return;
        }
  
        res.write("data: " + JSON.stringify(event) + "\n\n", (err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      });
    }

    try {
      // TODO: figure out if we can relocate this to be earlier by fixing the thing on the client where we refetch the latest conversation
      // which will be missing the latest messages, if we haven't actually inserted them into the database (which we do above)
      await sendNewConversationEvent(conversationContext, conversation, currentUser, sendEventToClient);
      
      const claudeResponse = await sendMessagesToClaude({
        previousMessages,
        newMessages,
        conversationId,
        model,
        currentUser,
        context,
        sendEventToClient
      });

      await createLlmMessage({ data: claudeResponse }, context);
      
      await sendStreamEndEvent(conversationId, sendEventToClient);
    } catch (err) {
      captureException(err);
      await sendStreamErrorEvent(conversationId, err.message, sendEventToClient);
    }

    res.end();
  });
}


// defineMutation({
//   name: 'getClaudeLoadingMessages',
//   // schema: `${ClaudeMessage}`,
//   argTypes: '(messages: [ClaudeMessage!]!, postId: String)',
//   resultType: '[String]',
//   fn: async (_, {messages, postId }: {messages: ClientMessage[], postId: string}, context): Promise<string[]> => {

//     const post = await fetchFragmentSingle({
//       collectionName: "Posts",
//       fragmentName: "PostsOriginalContents",
//       selector: {_id: postId},
//       currentUser: context.currentUser,
//       context,
//     }) ?? undefined

//     const firstQuery = messages.filter(message => message.role === 'user')[0]

//     const loadingMessagePrompt = generateLoadingMessagePrompt(firstQuery.content, post?.title)
//     console.log({loadingMessagePrompt})

//     const client = getAnthropicClientOrThrow()

//     const tools: Tool[] = [{
//       name: "humorous_loading_messages",
//       description: "Humurous loading messages to display to a user while their query is being processed",
//       "input_schema": {
//         "type": "object",
//         "properties": {
//           "messages": {
//             "type": "array",
//             "items": {
//               "type": "string"
//             },
//             "description": "A list of messages to display to the user while their query is being processed"
//           },
//         },
//         "required": ["messages"],
//       }
//     }]



//       // messages: [{role: "user", content: loadingMessagePrompt}]

//     const loadingMessagesResult = await client.messages.create({
//       model: "claude-3-5-sonnet-20240620",
//       max_tokens: 200,
//       tools,
//       tool_choice: {type: "tool", name: "humorous_loading_messages"},
//       messages: [{role: "user", content: loadingMessagePrompt}]
//     })

//     const loadingMessagesResponse = loadingMessagesResult.content[0]
//     // if (titleResponse.type === 'tool_use') {
//     //   throw new Error("response is tool use which is not a proper response in this context")
//     // }

//     console.log(JSON.stringify(loadingMessagesResponse, null, 2))

//     return []
//   }
// })
