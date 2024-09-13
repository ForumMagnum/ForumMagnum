import uniq from "lodash/uniq";
import { getAnthropicClientOrThrow, getAnthropicPromptCachingClientOrThrow } from "../languageModels/anthropicClient";
import { getEmbeddingsFromApi } from "../embeddings";
import { postGetPageUrl } from "@/lib/collections/posts/helpers";
import { generateContextSelectionPrompt, CLAUDE_CHAT_SYSTEM_PROMPT, generateTitleGenerationPrompt, generateAssistantContextMessage, CONTEXT_SELECTION_SYSTEM_PROMPT, contextSelectionResponseFormat, RECOMMENDATION_SYSTEM_PROMPT, generateAssistantRecommendationContextMessageV2, postRecommendationsResponseFormat } from "../languageModels/promptUtils";
import { FieldsNotNull, filterNonnull, filterWhereFieldsNotNull } from "@/lib/utils/typeGuardUtils";
import { userHasLlmChat } from "@/lib/betas";
import { PromptCachingBetaMessageParam, PromptCachingBetaTextBlockParam } from "@anthropic-ai/sdk/resources/beta/prompt-caching/messages";
import { userGetDisplayName } from "@/lib/collections/users/helpers";
import { ClaudeMessageRequestSchema, ClientMessage, LlmCreateConversationMessage, LlmStreamChunkMessage, LlmStreamContentMessage, LlmStreamEndMessage, LlmStreamErrorMessage, LlmStreamMessage, RagModeType } from "@/components/languageModels/LlmChatWrapper";
import { createMutator, getContextFromReqAndRes, runFragmentQuery } from "../vulcan-lib";
import { LlmVisibleMessageRole, UserVisibleMessageRole, llmVisibleMessageRoles } from "@/lib/collections/llmMessages/schema";
import { asyncMapSequential } from "@/lib/utils/asyncUtils";
import { markdownToHtml, htmlToMarkdown } from "../editor/conversionUtils";
import { getOpenAI } from "../languageModels/languageModelIntegration";
import express, { Express } from "express";
import { captureException } from "@sentry/core";
import { FilterSettings, getDefaultFilterSettings } from "@/lib/filterSettings";
import { fetchFragment } from "../fetchFragment";
import { Tool } from "@anthropic-ai/sdk/resources";
import sampleSize from "lodash/sampleSize";
import keyBy from "lodash/keyBy";

interface InitializeConversationArgs {
  newMessage: ClientMessage;
  systemPrompt: string;
  model: string;
  currentUser: DbUser;
  context: ResolverContext;
  currentPostId?: string;
  ragMode: RagModeType;
}

interface CreateNewConversationArgs {
  query: string;
  systemPrompt: string;
  model: string;
  currentUser: DbUser;
  context: ResolverContext;
  currentPost: PostsPage | null;
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

async function getQueryContextDecision(query: string, currentPost: PostsPage | null): Promise<RagContextType> {
  const openai = await getOpenAI();
  if (!openai) {
    return 'error';
  }

  // TODO: come back to this when haiku 3.5 is out to replace it, maybe
  const toolUseResponse = await openai.beta.chat.completions.parse({
    model: 'gpt-4o-mini-2024-07-18',
    messages: [
      { role: 'system', content: CONTEXT_SELECTION_SYSTEM_PROMPT },
      { role: 'user', content: generateContextSelectionPrompt(query, currentPost) }
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

// TODO: come back and refactor the query context decision to actually use the embedding distance results (including the post titles)
async function getContextualPosts(query: string, ragMode: RagModeType, currentPost: PostsPage | null, context: ResolverContext): Promise<PostsPage[]> {

  const ragModeMapping = {
    'CurrentPost': 'current-post-only',
    'Search': 'both',
    'None': 'none',
    'Recommendation': 'recommendation',
  }

  const contextSelectionCode = (ragMode === 'Auto')
    ? await getQueryContextDecision(query, currentPost)
    : ragModeMapping[ragMode];

  console.log({ ragMode,contextSelectionCode })
  
  const useQueryEmbeddings = ['query-based', 'both'].includes(contextSelectionCode);
  const useCurrentPost = ['current-post-only', 'current-post-and-search', 'both'].includes(contextSelectionCode);
  const useCurrentPostSearchEmbeddings = ['current-post-and-search', 'both'].includes(contextSelectionCode);


  const { embeddings: queryEmbeddings } = await getEmbeddingsFromApi(query);

  const querySearchPromise = useQueryEmbeddings
    ? context.repos.postEmbeddings.getNearestPostIdsWeightedByQuality(queryEmbeddings, contextSelectionCode==='query-based' ? 20 : 5)
    : Promise.resolve([]);

  const currentPostSearchPromise = useCurrentPostSearchEmbeddings && currentPost
    ? context.repos.postEmbeddings.getNearestPostIdsWeightedByQualityByPostId(currentPost._id, 20)
    : Promise.resolve([]);

  const [querySearchIds, currentPostSearchIds] = await Promise.all([
    querySearchPromise,
    currentPostSearchPromise,
  ]);

  const deduplicatedSearchResultIds = uniq([...querySearchIds, ...currentPostSearchIds]);

  // TODO: Clean up somehow. This is kind of ugly but this is where the decision is being made about whether or not to use the current post in the context window.
  const posts = await getPostsWithContents(deduplicatedSearchResultIds, context);
  if (useCurrentPost && currentPost && !deduplicatedSearchResultIds.includes(currentPost._id)) {
    posts.unshift(currentPost);
  }
  return posts;
};

async function getConversationTitle({ query, currentPost }: Pick<CreateNewConversationArgs, 'query' | 'currentPost'>) {
  const titleGenerationPrompt = generateTitleGenerationPrompt(query, currentPost)

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

async function createNewConversation({ query, systemPrompt, model, currentUser, context, currentPost }: CreateNewConversationArgs): Promise<DbLlmConversation> {
  const title = await getConversationTitle({ query, currentPost });
  const newConversation = await createMutator({
    collection: context.LlmConversations,
    document: {
      title,
      systemPrompt,
      model,
      userId: currentUser._id,
    },
    context,
    currentUser,
  });

  return newConversation.data;
};

function getPostContextMessage(postsLoadedIntoContext: PostsPage[]): string {

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

async function getPostWithContents(postId: string, context: ResolverContext): Promise<PostsPage | null> {
  const [post] = await runFragmentQuery({
    collectionName: 'Posts',
    fragmentName: 'PostsPage',
    terms: { postIds: [postId] },
    context,
  });

  return post ?? null;
}

async function getPostsWithContents(postIds: string[], context: ResolverContext) {
  return runFragmentQuery({
    collectionName: 'Posts',
    fragmentName: 'PostsPage',
    terms: { postIds },
    context,
  });
}

async function getContextMessages(query: string, ragMode: RagModeType, currentPost: PostsPage | null, context: ResolverContext) {
  
  if (['None', 'Recommendation'].includes(ragMode)) {
    return {
      userContextMessage: '',
      assistantContextMessage: '',
      contextualPosts: [],
    };
  }

  const contextualPosts = await getContextualPosts(query, ragMode, currentPost, context);
  const userContextMessage = getPostContextMessage(contextualPosts);
  const assistantContextMessage = await generateAssistantContextMessage(query, currentPost, contextualPosts, true, context);

  return { userContextMessage, assistantContextMessage, contextualPosts };
}

async function createConversationWithMessages({ newMessage, systemPrompt, model, currentPostId, ragMode, currentUser, context }: InitializeConversationArgs) {
  const { content: query, userId } = newMessage;

  const currentPost = await (currentPostId && ragMode !== 'None'
    ? getPostWithContents(currentPostId, context)
    : Promise.resolve(null)
  );

  const [conversation, { userContextMessage, assistantContextMessage, contextualPosts }] = await Promise.all([
    createNewConversation({
      query,
      systemPrompt,
      model,
      currentUser,
      context,
      currentPost,
    }),
    getContextMessages(query, ragMode, currentPost, context)
  ]);

  const conversationId = conversation._id;

  if (ragMode === 'Recommendation') {
    return createRecommendationsConversationWithMessages({ conversation, newMessage, systemPrompt, model, currentPostId, currentUser, context });
  }

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

  if (contextualPosts.length > 0) {
    newMessageRecords.push(newUserContextMessageRecord);
  }

  return {
    conversation,
    newMessageRecords
  };
}




async function getUserEmbeddingRecommendations(userId: string, numRecommendationPosts: number, oversamplingFactor=10, context: ResolverContext): Promise<PostsPage[]> {
  const embeddingRecommendationPostsIds = await context.repos.postEmbeddings.getEmbeddingRecommendationsForUser(userId, numRecommendationPosts * oversamplingFactor);
  const randomSampleEmbeddingRecommendationPostsIds = sampleSize(embeddingRecommendationPostsIds, numRecommendationPosts)
  const userEmbeddingRecommendationPosts = getPostsWithContents(randomSampleEmbeddingRecommendationPostsIds, context);

  return userEmbeddingRecommendationPosts
}

async function getRecommendationContextDataV2(query: string, userId: string, context: ResolverContext) {

  const filterSettings: FilterSettings = context.currentUser?.frontpageFilterSettings ?? getDefaultFilterSettings();

  const homeLatestPostsPromise = runFragmentQuery({
    collectionName: "Posts",
    fragmentName: "PostsPage",
    terms: {
      view: "magic",
      forum: true,
      limit: 50,
      filterSettings
    },
    context,
  });

  const userRecentUpvotesPromise = runFragmentQuery({
    collectionName: "Votes",
    fragmentName: "UserVotesWithFullDocument",
    terms: {
      selector: { 
        collectionName: 'Posts',
        userId, 
        power: {$gt: 0}, 
        votedAt: {$gt: new Date(Date.now() - (1000 * 60 * 60 * 24 * 365))},
        isUnvote: {$ne: true},
        cancelled: {$ne: true},
    }},
    currentUser: context.currentUser,
    context,
    options: {
      sort: {
        votedAt: -1,
      },
      limit: 30, //40,
    }
  });

  const userRecentViewsPromise = runFragmentQuery({
    collectionName: "ReadStatuses",
    fragmentName: "ReadStatusWithPostPage",
    selector: { userId },
    currentUser: context.currentUser,
    context,
    options: {
      sort: {
        lastUpdated: -1,
      },
      limit: 40
    },
    skipFiltering: true,
  });


  const [userRecentUpvotes, userRecentViews, homeLatestPosts, userEmbeddingRecommendationPosts] = await Promise.all([
    userRecentUpvotesPromise,
    userRecentViewsPromise,
    homeLatestPostsPromise,
    getUserEmbeddingRecommendations(userId, 20, 10, context)
  ]);

  const userUpvotedPosts = filterNonnull(userRecentUpvotes.map(vote => vote.post));
  const userRecentlyViewedPosts = filterNonnull(userRecentViews.map(view => view.post))
    .filter(post => !userUpvotedPosts.some(upvotedPost => upvotedPost._id === post._id))
    .slice(0, 40 - userUpvotedPosts.length);

  const homeLatestNotAlreadyReadPosts = homeLatestPosts.filter(post => !post.isRead)

  console.log({
    userRecentUpvotes,
    userUpvotedPosts,
    userUpvotedPostsTitles: userUpvotedPosts.map(post => ({ title: post.title, html: post.contents?.html.slice(0,200) })),
    userRecentlyViewedPostsTitles: userRecentlyViewedPosts.map(post => ({ title: post.title, id: post._id })),
    // homeLatestPostsTitles: homeLatestNotAlreadyReadPosts.map(post => post.title),
    // userEmbeddingRecommendationPostsTitles: userEmbeddingRecommendationPosts.map(post => post.title)
  })

  return {
    homeLatestPosts: homeLatestNotAlreadyReadPosts,
    userUpvotedPosts,
    userRecentlyViewedPosts,
    userEmbeddingRecommendationPosts,
  }
}


// TODO: Cleanup, this is for testing
async function createRecommendationsConversationWithMessages({ conversation, newMessage, systemPrompt, model, currentUser, context }: Omit<InitializeConversationArgs, 'ragMode'> & { conversation: DbLlmConversation }) {
  const { content: query, userId } = newMessage;
  
  const recommendationContextData = await getRecommendationContextDataV2(query, userId, context);
  const recommendationContextPrompt = await generateAssistantRecommendationContextMessageV2(query, recommendationContextData, context);

  const newUserMessageRecord = {
    userId,
    content: query,
    role: 'user',
    conversationId: conversation._id,
  } as const;

  const newAssistantContextMesssageRecord = {
    userId,
    content: recommendationContextPrompt,
    role: 'assistant-context',
    conversationId: conversation._id,
  } as const;

  const newMessageRecords: NewLlmMessage[] = [newUserMessageRecord, newAssistantContextMesssageRecord];

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


export function addLlmChatEndpoint(app: Express) {
  app.use("/api/sendLlmChat", express.json());
  app.post("/api/sendLlmChat", async (req, res) => {
    const context = await getContextFromReqAndRes({req, res, isSSR: false});
    const currentUser = context.currentUser;
    if (!userHasLlmChat(currentUser)) {
      return res.status(403).send('Only admins and authorized users can use Claude chat right now');
    }

    const parsedBody = ClaudeMessageRequestSchema.safeParse(req.body);

    if (!parsedBody.success) {
      return res.status(400).send('Invalid request body');
    }

    const { newMessage, promptContextOptions, newConversationChannelId } = parsedBody.data;    
    const { postId: currentPostId, ragMode } = promptContextOptions
    
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
    const systemPrompt = (() => {
      switch (ragMode) {
        case 'Recommendation':
          return RECOMMENDATION_SYSTEM_PROMPT;
        default:
          return CLAUDE_CHAT_SYSTEM_PROMPT;
      }
    })();

    // TODO: also figure out if we want prevent users from creating new conversations with multiple pre-filled messages

    const { conversation, newMessageRecords } = conversationContext.type === 'new'
      ? await createConversationWithMessages({ newMessage, systemPrompt, model, currentPostId, ragMode, currentUser, context })
      : await prepareMessagesForConversation({ newMessage, conversationId: conversationContext.conversationId, context });

    const conversationId = conversation._id;

    const now = new Date();
    const fetchPreviousMessagesPromise = context.LlmMessages.find({ conversationId, role: { $in: [...llmVisibleMessageRoles] }, createdAt: { $lt: now } }, { sort: { createdAt: 1 } }).fetch();

    const createNewMessagesSequentiallyPromise = asyncMapSequential(
      newMessageRecords,
      (message) => createMutator({
        collection: context.LlmMessages,
        document: message,
        context,
        currentUser,
      }).then(({ data }) => data)
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

      await createMutator({
        collection: context.LlmMessages,
        document: claudeResponse,
        context,
        currentUser,
      });
      
      await sendStreamEndEvent(conversationId, sendEventToClient);
    } catch (err) {
      captureException(err);
      await sendStreamErrorEvent(conversationId, err.message, sendEventToClient);
    }

    res.end();
  });
}

function isString(value: unknown) {
  return typeof value === 'string';
}

function getPostRecommendationsPrompt(user: DbUser, lastReadPosts: Array<FieldsNotNull<ReadStatusWithPostPage, "post">>, unreadPostTitles: Array<{ _id: string, title: string }>) {
  const availablePostTitlesString = sampleSize(unreadPostTitles, 500).map(({ title }) => title).join('\n');

  return `LessWrong user ${userGetDisplayName(user)} has most recently read the following posts:
  ${lastReadPosts.map(({ post, lastUpdated }) => {
    const contentPreview = htmlToMarkdown(post.contents?.html ?? '').slice(0, 500);
  
    return `Title: ${post.title}
Author: ${userGetDisplayName(post.user)}
Publish Date: ${post.postedAt}
Read Date: ${lastUpdated}
Score: ${post.baseScore}
Content Preview: ${contentPreview}`;
})}

Out of the following list of available posts, please recommend the next ten LessWrong posts they should read.  Do not recommend posts from the read history above.\n\n<AvailablePosts>${availablePostTitlesString}</AvailablePosts>`;
}

async function getGptPostRecommendations(user: DbUser, lastReadPosts: Array<FieldsNotNull<ReadStatusWithPostPage, "post">>, unreadPostTitles: Array<{ _id: string, title: string }>): Promise<string[]> {
  const openai = await getOpenAI();
  if (!openai) {
    throw new Error('Missing openai client!');
  }

  const prompt = getPostRecommendationsPrompt(user, lastReadPosts, unreadPostTitles);
  
  // TODO: come back to this when haiku 3.5 is out to replace it, maybe
  const toolUseResponse = await openai.beta.chat.completions.parse({
    model: 'gpt-4o-mini-2024-07-18',
    messages: [{ role: 'user', content: prompt }],
    response_format: postRecommendationsResponseFormat
  });

  const parsedResponse = toolUseResponse.choices[0].message.parsed;
  if (!parsedResponse) {
    // eslint-disable-next-line no-console
    console.log('Post recommendations response seems to be missing tool use arguments', { toolUseResponse: JSON.stringify(toolUseResponse, null, 2) });
    throw new Error('Post recommendations response seems to be missing tool use arguments');
  }

  return parsedResponse.titles;
}

async function getClaudePostRecommendations(user: DbUser, lastReadPosts: Array<FieldsNotNull<ReadStatusWithPostPage, "post">>, unreadPostTitles: Array<{ _id: string, title: string }>) {
  const client = getAnthropicPromptCachingClientOrThrow();

  const prompt = getPostRecommendationsPrompt(user, lastReadPosts, unreadPostTitles);

  const tool: Tool = {
    name: 'recommend_post_titles',
    description: 'Recommends posts with the provided titles to the user, based on what posts they might enjoy reading next, given their reading history.',
    input_schema: {
      type: 'object',
      properties: {
        titles: {
          type: 'array',
          items: {
            type: 'string'
          },
          description: 'The titles of the posts to serve to the user as recommendations.'
        }
      }
    }
  };

  const response = await client.messages.create({
    // model: 'claude-3-5-sonnet-20240620',
    model: 'claude-3-haiku-20240307',
    max_tokens: 1028,
    messages: [{ role: 'user', content: [{ type: 'text', text: prompt, /*cache_control: { type: 'ephemeral' }*/ }] }],
    tools: [tool],
    tool_choice: { type: 'tool', name: 'recommend_post_titles' } 
  });

  const [responseContent] = response.content;
  if (responseContent.type === 'text') {
    console.log({ text: responseContent.text });
    throw new Error('Got text response!');
  }

  const toolUseResponse = responseContent.input;
  if (toolUseResponse && typeof toolUseResponse === 'object' && ('titles' in toolUseResponse) && Array.isArray(toolUseResponse.titles) && toolUseResponse.titles.every(isString)) {
    console.log({ titles: toolUseResponse.titles });
    return toolUseResponse.titles;
  }

  console.log('Invalid tool_use response data format', { toolUseResponse });
  throw new Error('Invalid tool_use response data format');
}

export async function getLlmRecommendationsForUser(
  user: DbUser,
  limit: number,
  context: ResolverContext
) {
  const [lastReadStatuses, unreadPostTitles] = await Promise.all([
    runFragmentQuery({
      collectionName: "ReadStatuses",
      fragmentName: "ReadStatusWithPostPage",
      terms: { view: 'userReadStatuses', userId: user._id },
      context,
    }),
    context.repos.posts.getUnreadPostTitles(user._id)
  ]);

  const unreadPostMap = keyBy(unreadPostTitles, ({ title }) => title);

  const lastReadPosts = filterWhereFieldsNotNull(lastReadStatuses, 'post');

  console.log(`${unreadPostTitles.length} available posts, sampling 500`);

  const titles = await getGptPostRecommendations(user, lastReadPosts, unreadPostTitles);
  // const titles = await getClaudePostRecommendations(user, lastReadPosts, unreadPostTitles);

  const postIds = filterNonnull(titles.map(title => unreadPostMap[title]?._id));
  const recommendedPosts = await context.Posts.find({ _id: { $in: postIds } }).fetch();

  return recommendedPosts.map((post) => ({
    post,
    curated: false,
    stickied: false,
  }));
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
