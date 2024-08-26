import { defineMutation } from "../utils/serverGraphqlUtil";
import { getAnthropicClientOrThrow } from "../languageModels/anthropicClient";
import { getEmbeddingsFromApi } from "../embeddings";
import { postGetPageUrl } from "@/lib/collections/posts/helpers";
import { generateContextSelectionPrompt, CLAUDE_CHAT_SYSTEM_PROMPT, generateTitleGenerationPrompt, generateAssistantContextMessage } from "../languageModels/promptUtils";
import uniqBy from "lodash/uniqBy";
import { filterNonnull } from "@/lib/utils/typeGuardUtils";
import { userHasLlmChat } from "@/lib/betas";
import Anthropic from "@anthropic-ai/sdk";
import { PromptCachingBetaMessageParam, PromptCachingBetaTextBlockParam } from "@anthropic-ai/sdk/resources/beta/prompt-caching/messages";
import { userGetDisplayName } from "@/lib/collections/users/helpers";
import { sendSseMessageToUser } from "../serverSentEvents";
import { LlmCreateConversationMessage, LlmStreamContentMessage, LlmStreamEndMessage } from "@/components/hooks/useUnreadNotifications";
import { createMutator, runFragmentQuery } from "../vulcan-lib";
import { LlmVisibleMessageRole, llmVisibleMessageRoles } from "@/lib/collections/llmMessages/schema";
import { asyncMapSequential } from "@/lib/utils/asyncUtils";
import { markdownToHtml, htmlToMarkdown } from "../editor/conversionUtils";
import uniq from "lodash/uniq";

const ClientMessage = `input ClientLlmMessage {
  conversationId: String
  userId: String!
  content: String!
}`

const PromptContextOptions = `input PromptContextOptions {
  postId: String
  useRag: Boolean
  includeComments: Boolean
}`

interface ClientMessage {
  conversationId: string | null
  userId: string
  content: string
}

// If present, use to construct context
interface PromptContextOptions {
  postId?: string
  includeComments?: boolean
}

interface InitializeConversationArgs {
  newMessage: ClientMessage;
  systemPrompt: string;
  model: string;
  currentUser: DbUser;
  context: ResolverContext;
  currentPostId?: string;
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

interface SendMessagesToClaudeArgs {
  newMessages: DbLlmMessage[];
  previousMessages: DbLlmMessage[];
  context: ResolverContext;
  conversationId: string;
  model: string;
  currentUser: DbUser;
}

// a type for kind of context to use that's a value of "query-based", "post-based", or "both"
type RagContextType = "query-based" | "current-post-based" | "both" | "none" | "error"

function getConversationContext(newConversationChannelId: string | null, newMessage: ClientMessage): ConversationContext {
  return newConversationChannelId ? {
    newConversationChannelId,
    type: 'new',
  } : {
    conversationId: newMessage.conversationId!,
    type: 'existing',
  };
}

// TODO: convert this to tool use for reliability
async function getQueryContextDecision(query: string, currentPost: PostsPage | null): Promise<RagContextType> {
  const contextSelectionPrompt = generateContextSelectionPrompt(query, currentPost)
  const contextTypeMapping: Record<string, RagContextType> = {
    "(1)": "query-based",
    "(2)": "current-post-based",
    "(3)": "both",
    "(4)": "none"
  }

  const client = getAnthropicClientOrThrow()
  const response = await client.messages.create({
    model: "claude-3-haiku-20240307",
    max_tokens: 512,
    messages: [{role: "user", content: contextSelectionPrompt}]
  })

  const result = response.content[0]
  if (result.type === 'tool_use') {
    throw new Error("response is tool use which is not a proper response in this context")
  }

  // console.log({result, contextSelectionPrompt: contextSelectionPrompt.slice(0, 500) + '....' + contextSelectionPrompt.slice(-1000)})

  //check if result is one of the expected values
  if (!["(1)", "(2)", "(3)", "(4)"].includes(result.text.slice(0, 3))) {
    return "error";
  }
  else {
    return contextTypeMapping[result.text.slice(0, 3)]
  }
}

async function getContextualPosts(query: string, currentPost: PostsPage | null, context: ResolverContext): Promise<PostsPage[]> {
  const contextSelectionCode = await getQueryContextDecision(query, currentPost);
  const useQueryEmbeddings = ['query-based', 'both'].includes(contextSelectionCode);
  const useCurrentPostEmbeddings = ['current-post-based', 'both'].includes(contextSelectionCode);

  const { embeddings: queryEmbeddings } = await getEmbeddingsFromApi(query);

  const querySearchPromise = useQueryEmbeddings
    ? context.repos.postEmbeddings.getNearestPostIdsWeightedByQuality(queryEmbeddings, contextSelectionCode==='query-based' ? 10 : 3)
    : Promise.resolve([]);

  const currentPostSearchPromise = useCurrentPostEmbeddings && currentPost
    ? context.repos.postEmbeddings.getNearestPostIdsWeightedByQualityByPostId(currentPost._id)
    : Promise.resolve([]);

  const [querySearchIds, currentPostSearchIds] = await Promise.all([
    querySearchPromise,
    currentPostSearchPromise,
  ]);

  const deduplicatedSearchResultIds = uniq([...querySearchIds, ...currentPostSearchIds]);

  return getPostsWithContents(deduplicatedSearchResultIds, context);
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
    throw new Error("response is tool use which is not a proper response in this context")
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

function getPostContextMessage(query: string, postsLoadedIntoContext: PostsPage[], currentPost: PostsPage | null): string {
  // get the combined list of current post and posts loaded into context that handles the possibility they are empty or null
  const allLoadedPosts = filterNonnull([currentPost, ...postsLoadedIntoContext ?? []]);
  // Current post might be one of the posts returned from the query-based embedding search
  const deduplicatedPosts = uniqBy(allLoadedPosts, post => post._id);

  const deduplicatedPostsList = deduplicatedPosts.map((post) => {
    const author = userGetDisplayName(post.user)
    return  `- *[${post?.title}](${postGetPageUrl(post)}) by ${author}*`}
  ).join("\n");

  const message = [
    `*Based on your query, the following posts were loaded into the LLM's context window*:`,
    deduplicatedPostsList,
    `\n*(This message and similar messages are not sent to the LLM.)*`
  ].join("\n");

  return message;
}

function sendNewConversationEvent(conversationContext: ConversationContext, conversation: DbLlmConversation, currentUser: DbUser) {
  if (conversationContext.type === 'new') {
    const newConversationEvent: LlmCreateConversationMessage = {
      eventType: 'llmCreateConversation',
      title: conversation.title,
      conversationId: conversation._id,
      createdAt: conversation.createdAt.toISOString(),
      userId: currentUser._id,
      channelId: conversationContext.newConversationChannelId,
    };

    sendSseMessageToUser(currentUser._id, newConversationEvent);
  }
}

async function getPreviousUserMessageData(message?: DbLlmMessage): Promise<LlmStreamContentMessage['data']['previousUserMessage']> {
  if (!message || message.role !== 'user') {
    return undefined;
  }

  const { _id, content, role, userId, createdAt } = message;

  const parsedContent = await markdownToHtml(content);

  return {
    _id,
    content: parsedContent,
    role,
    userId,
    createdAt: createdAt.toISOString()
  };
}

async function sendStreamContentEvent(conversationId: string, messageBuffer: string, currentUser: DbUser, lastUserMessage?: DbLlmMessage) {
  const [previousUserMessage, parsedMessageBuffer] = await Promise.all([
    getPreviousUserMessageData(lastUserMessage),
    markdownToHtml(messageBuffer)
  ]);

  const streamContentEvent: LlmStreamContentMessage = {
    eventType: 'llmStreamContent',
    data: {
      content: parsedMessageBuffer,
      previousUserMessage,
      conversationId,
    },
  };

  sendSseMessageToUser(currentUser._id, streamContentEvent);
}

function sendStreamEndEvent(conversationId: string, currentUser: DbUser) {
  const streamEndEvent: LlmStreamEndMessage = {
    eventType: 'llmStreamEnd',
    data: { conversationId },
  };

  sendSseMessageToUser(currentUser._id, streamEndEvent);
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

async function sendMessagesToClaude({ previousMessages, newMessages, conversationId, model, currentUser }: SendMessagesToClaudeArgs) {
  const client = getAnthropicClientOrThrow();
  const promptCachingClient = new Anthropic.Beta.PromptCaching(client);

  const conversationMessages = [...previousMessages, ...newMessages];
  const messagesForClaude = conversationMessages.filter(isClaudeAllowableMessage);
  const preparedMessages = messagesForClaude.map((message, idx) => createClaudeMessage(message, idx === 0));

  // time this
  const startTime = new Date().getTime();

  const stream = promptCachingClient.messages.stream({
    model,
    system: CLAUDE_CHAT_SYSTEM_PROMPT,
    max_tokens: 4096,
    messages: preparedMessages,
  });

  let buffer = '';
  stream.on('text', (text) => {
    const isFirstChunk = buffer === '';
    const includePreviousUserMessage = isFirstChunk && previousMessages.length > 0;

    const previousUserMessage = includePreviousUserMessage
      ? newMessages[0]
      : undefined;

    buffer += text;

    void sendStreamContentEvent(conversationId, buffer, currentUser, previousUserMessage);
  });

  const finalMessage = await stream.finalMessage();
  const endTime = new Date().getTime();

  const response = finalMessage.content[0];
  if (response.type === 'tool_use') {
    throw new Error("response is tool use which is not a proper response in this context");
  }

  const resultUsageField = finalMessage.usage;
  // TO-DO: remove this console log when we're more done with development
  // eslint-disable-next-line no-console
  console.log({LlmResponseTime: endTime - startTime, resultUsageField});

  const newResponse = {
    conversationId,
    userId: currentUser._id,
    role: "assistant" as const,
    content: response.text,
  };

  return newResponse;
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

async function getContextMessages(content: string, currentPost: PostsPage | null, context: ResolverContext) {
  const contextualPosts = await getContextualPosts(content, currentPost, context);
  const userContextMessage = getPostContextMessage(content, contextualPosts, currentPost);
  const assistantContextMessage = await generateAssistantContextMessage(content, currentPost, contextualPosts, false, context);

  return { userContextMessage, assistantContextMessage };
}

async function createConversationWithMessages({ newMessage, systemPrompt, model, currentPostId, currentUser, context }: InitializeConversationArgs) {
  const { content, userId } = newMessage;

  const currentPost = await (currentPostId
    ? getPostWithContents(currentPostId, context)
    : Promise.resolve(null)
  );

  const [conversation, { userContextMessage, assistantContextMessage }] = await Promise.all([
    createNewConversation({
      query: content,
      systemPrompt,
      model,
      currentUser,
      context,
      currentPost,
    }),
    getContextMessages(content, currentPost, context)
  ]);

  const conversationId = conversation._id;

  const newUserContextMessageRecord = {
    userId,
    content: userContextMessage,
    role: 'user-context',
    conversationId,
  } as const;

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

  const newUserMessageRecord = {
    userId,
    content,
    role: 'user',
    conversationId,
  } as const;

  return {
    conversation,
    newMessageRecords: [newAssistantContextMessageRecord, newAssistantAckMessageRecord, newUserMessageRecord, newUserContextMessageRecord],
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

defineMutation({
  name: 'sendClaudeMessage',
  schema: `${ClientMessage}\n${PromptContextOptions}`,
  argTypes: '(newMessage: ClientLlmMessage!, promptContextOptions: PromptContextOptions!, newConversationChannelId: String)',
  resultType: 'JSON',
  fn: async (_, { newMessage, promptContextOptions, newConversationChannelId }: {
    newMessage: ClientMessage,
    promptContextOptions: PromptContextOptions,
    title: string | null,
    newConversationChannelId: string | null
  }, context) => {
    const { currentUser } = context;
    const { postId: currentPostId } = promptContextOptions

    if (!currentUser || !userHasLlmChat(currentUser)) {
      throw new Error("only admins and authorized users can use Claude chat at present")
    }

    if (!newConversationChannelId && !newMessage.conversationId) {
      throw new Error('Message must either be part of an existing conversation, or a new conversation channel id needs to be provided');
    }

    if (newConversationChannelId && newMessage.conversationId) {
      throw new Error('Cannot create a new conversation for a message sent for an existing conversationId');
    }

    if (newMessage.content.trim().length === 0) {
      throw new Error('Message must contain non-whitespace content');
    }

    const markdown = htmlToMarkdown(newMessage.content);
    newMessage.content = markdown;

    // Check again post-markdown conversion, in case we got a set of html tags that resulted in an empty string
    if (newMessage.content.trim().length === 0) {
      throw new Error('Message must contain non-whitespace content');
    }

    const conversationContext = getConversationContext(newConversationChannelId, newMessage);

    if (conversationContext.type === 'existing') {
      const conversation = await context.loaders.LlmConversations.load(conversationContext.conversationId);
      if (conversation?.userId !== currentUser._id) {
        throw new Error(`Conversation does not belong to current user!`);
      }
    }

    // TODO: if we allow user-configured system prompts, this is where we'll change it
    const systemPrompt = CLAUDE_CHAT_SYSTEM_PROMPT;
    const model = 'claude-3-5-sonnet-20240620';

    // TODO: also figure out if we want prevent users from creating new conversations with multiple pre-filled messages

    const { conversation, newMessageRecords } = conversationContext.type === 'new'
      ? await createConversationWithMessages({ newMessage, systemPrompt, model, currentPostId, currentUser, context })
      : await prepareMessagesForConversation({ newMessage, conversationId: conversationContext.conversationId, context });

    const conversationId = conversation._id;

    const now = new Date();

    const fetchPreviousMessagesPromise = context.LlmMessages.find({ conversationId, role: { $in: [...llmVisibleMessageRoles] }, createdAt: { $lt: now } }, { sort: { createdAt: 1 } }).fetch();
    const createNewMessagesSequentiallyPromise = asyncMapSequential(newMessageRecords, async (message) => createMutator({
      collection: context.LlmMessages,
      document: message,
      context,
      currentUser,
    }).then(({ data }) => data));

    const [previousMessages, newMessages] = await Promise.all([
      fetchPreviousMessagesPromise,
      createNewMessagesSequentiallyPromise,
    ]);

    // const conversationMessages = [...previousMessages, ...newMessages];

    // TODO: figure out if we can relocate this to be earlier by fixing the thing on the client where we refetch the latest conversation
    // which will be missing the latest messages, if we haven't actually inserted them into the database (which we do above)
    sendNewConversationEvent(conversationContext, conversation, currentUser);
    
    const claudeResponse = await sendMessagesToClaude({
      previousMessages,
      newMessages,
      conversationId,
      model,
      currentUser,
      context,
    });

    await createMutator({
      collection: context.LlmMessages,
      document: claudeResponse,
      context,
      currentUser,
    });

    sendStreamEndEvent(conversationId, currentUser);
  }
})


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


