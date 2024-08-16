import { defineMutation } from "../utils/serverGraphqlUtil";
import { getAnthropicClientOrThrow } from "../languageModels/anthropicClient";
import { z } from 'zod'
import { getEmbeddingsFromApi } from "../embeddings";
import { markdownToHtml } from "../editor/conversionUtils";
import { postGetPageUrl } from "@/lib/collections/posts/helpers";
import { generateContextSelectionPrompt, generateLoadingMessagePrompt, generatePromptWithContext, generateSystemPrompt, generateTitleGenerationPrompt } from "../languageModels/promptUtils";
import uniqBy from "lodash/uniqBy";
import { filterNonnull } from "@/lib/utils/typeGuardUtils";
import { userHasLlmChat } from "@/lib/betas";
import Anthropic from "@anthropic-ai/sdk";
import { PromptCachingBetaMessageParam, PromptCachingBetaTextBlockParam } from "@anthropic-ai/sdk/resources/beta/prompt-caching/messages";
import { Tool } from "@anthropic-ai/sdk/resources/messages";
import { fetchFragmentSingle } from "../fetchFragment";
import { userGetDisplayName } from "@/lib/collections/users/helpers";
import { sendSseMessageToUser } from "../serverSentEvents";
import { LlmSetTitleMessage, LlmStreamMessage } from "@/components/hooks/useUnreadNotifications";

const ClaudeMessage = `input ClaudeMessage {
  role: String!
  content: String!
  displayContent: String
}`

const PromptContextOptions = `input PromptContextOptions {
  query: String!
  postId: String
  useRag: Boolean
  includeComments: Boolean
}`

interface ClaudeMessage {
  role: 'user'|'assistant'
  content: string
  displayContent?: string
}

interface ClaudeConversation {
  messages: ClaudeMessage[]
  title: string
}

// If present, use to construct context
interface PromptContextOptions {
  query: string
  postId?: string
  useRag?: boolean // TODO: deprecate?
  includeComments?: boolean
  // editorContents: 
}
interface PromptContextOptionsWithFulLPost {
  query: string
  post?: PostsPage
  useRag?: boolean
  includeComments?: boolean
  // editorContents: 
}


const claudeMessageSchema = z.object({
  role: z.union([z.literal('user'), z.literal('assistant')]),
  content: z.string(),
  displayContent: z.optional(z.string())
})

const claudeMessagesSchema = z.array(claudeMessageSchema)

// a type for kind of context to use that's a value of "query-based", "post-based", or "both"
type RagContextType = "query-based" | "current-post-based" | "both" | "none" | "error"

// TODO: convert this to tool use for reliability
const selectAdditionalContext = async (query: string, currentPost?: PostsPage): Promise<RagContextType> => {
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

  console.log({result, contextSelectionPrompt: contextSelectionPrompt.slice(0, 500) + '....' + contextSelectionPrompt.slice(-1000)})

  //check if result is one of the expected values
  if (!["(1)", "(2)", "(3)", "(4)"].includes(result.text.slice(0, 3))) {
    return "error";
  }
  else {
    return contextTypeMapping[result.text.slice(0, 3)]
  }
}

const createPromptWithContext = async (options: PromptContextOptionsWithFulLPost, context: ResolverContext) => {
  const { query, post: currentPost, includeComments } = options

  const contextSelectionCode = await selectAdditionalContext(query, currentPost)
  const useQueryRelatedPostsContext = ['query-based', 'both'].includes(contextSelectionCode)
  const useCurrentPostAndRelatedContext = ['current-post-based', 'both'].includes(contextSelectionCode)

  const { embeddings: queryEmbeddings } = await getEmbeddingsFromApi(query)
  const nearestPostsBasedOnQuery = useQueryRelatedPostsContext ? await context.repos.postEmbeddings.getNearestPostsWeightedByQuality(queryEmbeddings, contextSelectionCode==='query-based' ? 10 : 3) : []
  const nearestPostsBasedOnCurrentPost: PostsPage[] = useCurrentPostAndRelatedContext && currentPost ? await context.repos.postEmbeddings.getNearestPostsWeightedByQualityByPostId(currentPost._id) : []

  const nearestPostsPossiblyDuplicated = [...nearestPostsBasedOnQuery, ...nearestPostsBasedOnCurrentPost]  
  const nearestPosts = Array.from(new Set(nearestPostsPossiblyDuplicated.map(post => post._id))).map(postId => nearestPostsPossiblyDuplicated.find(post => post._id === postId) as PostsPage)

  const prompt = await generatePromptWithContext(query, context, currentPost, nearestPosts, includeComments)

  console.log({
    contextSelectionCode,
    useQueryRelatedPostsContext,
    useCurrentPostAndRelatedContext, 
    nearestPostsBasedOnQueryTitles: nearestPostsBasedOnQuery.map(post => post.title), 
    nearestPostsBasenOnPostIdTitles: nearestPostsBasedOnCurrentPost.map(post => post.title),
    compiledPrompt: prompt.slice(0, 500) + '....' + prompt.slice(-1000)
  })

  return { queryWithContext: prompt, postsLoadedIntoContext: nearestPosts }    
}

const getConversationTitle = async (query: string, currentUser: DbUser, currentPost?: PostsPage) => {
  const titleGenerationPrompt = generateTitleGenerationPrompt(query, currentPost)
  console.log("titleGenerationPrompt", titleGenerationPrompt)

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

  const message: LlmSetTitleMessage = {
    eventType: 'llmSetTitle',
    title: titleResponse.text,
  };

  sendSseMessageToUser(currentUser._id, message);

  return titleResponse.text
}

const generateModifiedFirstMessagePrompt = async (query: string, currentPost?: PostsPage, postsLoadedIntoContext?: PostsPage[]): Promise<string> => {
  // get the combined list of current post and posts loaded into context that handles the possibility they are empty or null
  const allLoadedPosts = filterNonnull([currentPost, ...postsLoadedIntoContext ?? []])
  const deduplicatedPosts = uniqBy(allLoadedPosts, post => post._id)

  const message =  [
    '*Based on your query, the following posts were loaded into the LLM\'s context window*:',
    deduplicatedPosts.map((post) => {
      const author = userGetDisplayName(post.user)
      return  `- *[${post?.title}](${postGetPageUrl(post)}) by ${author}*`}
    ).join("\n"),
    `\n\n*You asked:*\n\n`,
    query
  ].join("\n")

  return markdownToHtml(message)
}

const prepareMessageForClaude = (message: ClaudeMessage): PromptCachingBetaMessageParam => {
  const modifiedContent: Array<PromptCachingBetaTextBlockParam> = [{
    type: 'text',
    text: message.content,
    // cache_control: {type: "ephemeral"}
  }]

  return {
    role: message.role,
    content: modifiedContent,
  }
}

const initializeConversation = async ({ query, currentPostId, promptContextOptions, currentUser, context }: { 
  query: string, 
  currentPostId?: string,
  promptContextOptions: PromptContextOptions,
  currentUser: DbUser,
  context: ResolverContext
}) => {
  const currentPost = await fetchFragmentSingle({
    collectionName: "Posts",
    fragmentName: "PostsPage",
    selector: {_id: currentPostId},
    currentUser: context.currentUser,
    context,
  }) ?? undefined

  const [{queryWithContext, postsLoadedIntoContext}, newTitle] = await Promise.all(
    [
      createPromptWithContext({...promptContextOptions, post: currentPost}, context),
      getConversationTitle(query, currentUser, currentPost)
    ]
  )
  
  const displayContent = postsLoadedIntoContext.length ? await generateModifiedFirstMessagePrompt(query, currentPost, postsLoadedIntoContext) : undefined

  const modifiedFirstMessage = {
    role: "user" as const,
    content: queryWithContext,
    displayContent
  }

  return { modifiedFirstMessage, newTitle }
}


defineMutation({
  name: 'sendClaudeMessage',
  schema: `${ClaudeMessage}\n${PromptContextOptions}`,
  argTypes: '(messages: [ClaudeMessage!]!, promptContextOptions: PromptContextOptions!, title: String)',
  resultType: 'JSON',
  fn: async (_, {messages, promptContextOptions, title: existingTitle }: {messages: ClaudeMessage[], promptContextOptions: PromptContextOptions, title: string|null}, context): Promise<ClaudeConversation> => {
    const { currentUser } = context;
    const { postId: currentPostId } = promptContextOptions

    if (!currentUser || !userHasLlmChat(currentUser)) {
      throw new Error("only admins and authorized users can use Claude chat at present")
    }

    // Check that conversation history past in conforms to schema
    const parsedMessagesWrapper = claudeMessagesSchema.safeParse(messages)

    if (!parsedMessagesWrapper.success) {
      throw new Error("role must be either user or assistant")
    }

    const validatedMessages = parsedMessagesWrapper.data
    const firstQuery = validatedMessages.filter(message => message.role === 'user')[0]

    // Start of Converation Actions (first message from user)
    let updatedTitle = existingTitle
    // const messagesForClaude: PromptCachingBetaMessageParam[] = validatedMessages.map(({role, content}) => ({role, content}))
    const messagesForClient: ClaudeMessage[] = validatedMessages
    const startOfNewConversation = validatedMessages.filter(message => message.role === 'user').length === 1
    if  (startOfNewConversation) {
      const { modifiedFirstMessage, newTitle } = await initializeConversation({ query: firstQuery.content, currentPostId, promptContextOptions, currentUser, context })
      updatedTitle ??= newTitle
      messagesForClient[0] = modifiedFirstMessage
    }

    const messagesForClaude = [prepareMessageForClaude(messagesForClient[0]), ...messagesForClient.slice(1).map(({role, content}) => ({role, content}))]

    // time this
    const startTime = new Date().getTime()
    
    const client = getAnthropicClientOrThrow()
    const promptCaching = new Anthropic.Beta.PromptCaching(client)
    const stream = promptCaching.messages.stream({
      model: "claude-3-5-sonnet-20240620",
      system: generateSystemPrompt(),
      max_tokens: 4096,
      messages: messagesForClaude,
    });

    const finalMessage = await stream.finalMessage();
    const endTime = new Date().getTime()

    const response = finalMessage.content[0]
    if (response.type === 'tool_use') {
      throw new Error("response is tool use which is not a proper response in this context")
    }

    const resultUsageField = finalMessage.usage
    console.log("Time to get response from Claude", endTime - startTime)
    console.log({resultUsageField})

    const responseHtml = await markdownToHtml(response.text)

    messagesForClient.push({ role: "assistant", content: response.text, displayContent: responseHtml })

    const message: LlmStreamMessage = {
      eventType: 'llmStream',
      data: {
        content: response.text,
        displayContent: responseHtml,
        title: updatedTitle ?? `Conversation with Claude ${new Date().toISOString().slice(0, 10)}`
      }
    };

    sendSseMessageToUser(currentUser._id, message);

    // TODO: clean this up if we're returning via SSE
    return {
      messages: messagesForClient,
      title: updatedTitle ?? `Conversation with Claude ${new Date().toISOString().slice(0, 10)}`
    }
  }
})


defineMutation({
  name: 'getClaudeLoadingMessages',
  // schema: `${ClaudeMessage}`,
  argTypes: '(messages: [ClaudeMessage!]!, postId: String)',
  resultType: '[String]',
  fn: async (_, {messages, postId }: {messages: ClaudeMessage[], postId: string}, context): Promise<string[]> => {

    const post = await fetchFragmentSingle({
      collectionName: "Posts",
      fragmentName: "PostsOriginalContents",
      selector: {_id: postId},
      currentUser: context.currentUser,
      context,
    }) ?? undefined

    const firstQuery = messages.filter(message => message.role === 'user')[0]

    const loadingMessagePrompt = generateLoadingMessagePrompt(firstQuery.content, post?.title)
    console.log({loadingMessagePrompt})

    const client = getAnthropicClientOrThrow()

    const tools: Tool[] = [{
      name: "humorous_loading_messages",
      description: "Humurous loading messages to display to a user while their query is being processed",
      "input_schema": {
        "type": "object",
        "properties": {
          "messages": {
            "type": "array",
            "items": {
              "type": "string"
            },
            "description": "A list of messages to display to the user while their query is being processed"
          },
        },
        "required": ["messages"],
      }
    }]



      // messages: [{role: "user", content: loadingMessagePrompt}]

    const loadingMessagesResult = await client.messages.create({
      model: "claude-3-5-sonnet-20240620",
      max_tokens: 200,
      tools,
      tool_choice: {type: "tool", name: "humorous_loading_messages"},
      messages: [{role: "user", content: loadingMessagePrompt}]
    })

    const loadingMessagesResponse = loadingMessagesResult.content[0]
    // if (titleResponse.type === 'tool_use') {
    //   throw new Error("response is tool use which is not a proper response in this context")
    // }

    console.log(JSON.stringify(loadingMessagesResponse, null, 2))

    return []
  }
})

