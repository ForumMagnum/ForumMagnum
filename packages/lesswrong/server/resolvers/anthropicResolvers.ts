import { defineMutation } from "../utils/serverGraphqlUtil";
import { getAnthropicClientOrThrow } from "../languageModels/anthropicClient";
import { z } from 'zod'
import { getEmbeddingsFromApi } from "../embeddings";
import { markdownToHtml } from "../editor/conversionUtils";
import { postGetPageUrl } from "@/lib/collections/posts/helpers";
import { generateContextSelectionPrompt, generatePromptWithContext, generateSystemPrompt, generateTitleGenerationPrompt } from "../languageModels/promptUtils";
import uniqBy from "lodash/uniqBy";
import { filterNonnull } from "@/lib/utils/typeGuardUtils";
import { userHasLlmChat } from "@/lib/betas";

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
  role: string
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
  post?: DbPost
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
const selectAdditionalContext = async (query: string, currentPost?: DbPost): Promise<RagContextType> => {

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
    return "error" as RagContextType
  }
  else {
    return contextTypeMapping[result.text.slice(0, 3)]
  }
}

const createPromptWithContext = async (options: PromptContextOptionsWithFulLPost, context: ResolverContext) => {
  const { query, post: currentPost, useRag, includeComments } = options

  const contextSelectionCode = await selectAdditionalContext(query, currentPost)
  const useQueryRelatedPostsContext = ['query-based', 'both'].includes(contextSelectionCode)
  const useCurrentPostAndRelatedContext = ['current-post-based', 'both'].includes(contextSelectionCode)

  const { embeddings: queryEmbeddings } = await getEmbeddingsFromApi(query)
  const nearestPostsBasedOnQuery = useQueryRelatedPostsContext ? await context.repos.postEmbeddings.getNearestPostsWeightedByQuality(queryEmbeddings, contextSelectionCode==='query-based' ? 10 : 3) : []
  const nearestPostsBasedOnCurrentPost: DbPost[] = useCurrentPostAndRelatedContext && currentPost ? await context.repos.postEmbeddings.getNearestPostsWeightedByQualityByPostId(currentPost._id) : []

  const nearestPostsPossiblyDuplicated = [...nearestPostsBasedOnQuery, ...nearestPostsBasedOnCurrentPost]  
  const nearestPosts = Array.from(new Set(nearestPostsPossiblyDuplicated.map(post => post._id))).map(postId => nearestPostsPossiblyDuplicated.find(post => post._id === postId) as DbPost)

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

const getConversationTitle = async (query: string, currentPost?: DbPost) => {
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

    return titleResponse.text
  }

const generateModifiedFirstMessagePrompt = async (query: string, currentPost?: DbPost, postsLoadedIntoContext?: DbPost[]): Promise<string> => {
  // get the combined list of current post and posts loaded into context that handles the possibility they are empty or null
  const allLoadedPosts = filterNonnull([currentPost, ...postsLoadedIntoContext ?? []])
  const deduplicatedPosts = uniqBy(allLoadedPosts, post => post._id)

  const message =  [
    '*Based on your query, the following posts were loaded into the LLM\'s context window*:',
    deduplicatedPosts.map(post => `- *[${post?.title}](${postGetPageUrl(post)}) by ${post?.author}*`).join("\n"),
    `\n\n*You asked:*\n\n`,
    query
  ].join("\n")

  return markdownToHtml(message)
}


defineMutation({
  name: 'sendClaudeMessage',
  schema: `${ClaudeMessage}\n${PromptContextOptions}`,
  argTypes: '(messages: [ClaudeMessage!]!, promptContextOptions: PromptContextOptions!, title: String)',
  resultType: 'JSON',
  fn: async (_, {messages, promptContextOptions, title }: {messages: ClaudeMessage[], promptContextOptions: PromptContextOptions, title: string|null}, context): Promise<ClaudeConversation> => {
    const { currentUser } = context;
    const { postId: currentPostId } = promptContextOptions

    if (!userHasLlmChat(currentUser)) {
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
    let updatedTitle = title
    const startOfNewConversation = validatedMessages.filter(message => message.role === 'user').length === 1
    if  (startOfNewConversation) {
      const currentPost = currentPostId ? await context.loaders.Posts.load(currentPostId) : undefined
      const [{queryWithContext, postsLoadedIntoContext}, newTitle]  = await Promise.all(
        [
          createPromptWithContext({...promptContextOptions, post: currentPost}, context),
          !title ? getConversationTitle(firstQuery.content, currentPost) : null,
        ]
      )

      const displayContent = postsLoadedIntoContext.length ? await generateModifiedFirstMessagePrompt(firstQuery.content, currentPost, postsLoadedIntoContext) : undefined
      updatedTitle = title ?? newTitle

      // replace the first message in validateMessages with queryWithContext and insert displayContent
      validatedMessages[0] = {
        role: firstQuery.role,
        content: queryWithContext,
        displayContent
      }
    }


    const client = getAnthropicClientOrThrow()
    const result = await client.messages.create({
      model: "claude-3-5-sonnet-20240620",
      system: generateSystemPrompt(),
      max_tokens: 4096,
      messages: validatedMessages.map(({role, content}) => ({role, content}))  // remove displayContent from messages, doesn't conform to API
    })

    const response = result.content[0]
    if (response.type === 'tool_use') {
      throw new Error("response is tool use which is not a proper response in this context")
    }

    const responseHtml = await markdownToHtml(response.text)

    const updatedMessages = [...validatedMessages, { role: "assistant", content: response.text, displayContent: responseHtml }]

    return {
      messages: updatedMessages,
      title: updatedTitle ?? `Conversation with Claude ${new Date().toISOString().slice(0, 10)}`
    }
  }
})
