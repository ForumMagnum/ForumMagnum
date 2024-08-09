import { userIsAdmin } from "@/lib/vulcan-users";
import { defineMutation } from "../utils/serverGraphqlUtil";
import { getAnthropicClientOrThrow } from "../languageModels/anthropicClient";
import { z } from 'zod'
import { getEmbeddingsFromApi } from "../embeddings";
import { dataToMarkdown, markdownToHtml } from "../editor/conversionUtils";
import { postGetPageUrl } from "@/lib/collections/posts/helpers";

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
  postId?: string,
  post?: DbPost, //TODO: Make the type be one or the other
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

const postToMarkdown = (post: DbPost) => {
  const originalContents = post.contents?.originalContents
  if (!originalContents) {
    return undefined
  }
  return dataToMarkdown(originalContents.data, originalContents.type)
}

const createPromptWithContext = async (options: PromptContextOptions, context: ResolverContext) => {

  console.log("Creating prompt with context", options)
  const { query, postId, post: providedPost, useRag, includeComments } = options

  if (!query && !postId && !providedPost) {
    throw new Error("Either query or postId must be provided")
  }
    
  let post
  let postContextPrompt = ""
  if (postId || providedPost ) {
    if (providedPost) {
      post = providedPost
    } else if (postId) {
      post = await context.loaders.Posts.load(postId)
    }

    if (!post) {
      // eslint-disable-next-line no-console
      console.error("Post not found based on provided post or postId", postId)

    } else {
      const author = await context.loaders.Users.load(post.userId)
      const authorName = author.displayName ?? author.username // TODO: If using on AF, use full name
      const markdown = postToMarkdown(post)
      const formattedCurrentPost = `
  postId: ${post._id}
  Title: ${post.title}
  Author: ${authorName}
  Publish Date: ${post.postedAt}
  Score: ${post.baseScore} 
  Content:
  ${markdown}
  `
    postContextPrompt = `The user is currently viewing the following post. 
    <UsersCurrentPost>${formattedCurrentPost}</UsersCurrentPost>
    - Its contents might be extremely relevant to the question or not at all. Use your judgment for whether or not to draw upon.
    - If citing the the post, do so with the following format: [Post Title](https//lesswrong.com/posts/<postId>). The postId is given in the search results. Ensure you also give the displayName of the author.
    \n`
    }
  }

  let nearestPosts: DbPost[] = []
  let searchResultsContextPrompt = ""
  if (query && useRag) {
    const { embeddings } = await getEmbeddingsFromApi(query)
    nearestPosts = await context.repos.postEmbeddings.getNearestPostsWeightedByQuality(embeddings)

    const formattedPostsFromQueryMatch: string[] = nearestPosts.map((post, index) => {
      const markdown = postToMarkdown(post)
      return `
  Search Result #${index}
  postId: ${post._id}
  Title: ${post.title}
  Author: ${post.author}
  Publish Date: ${post.postedAt}
  Score: ${post.baseScore}
  Content:
  ${markdown}`
    })

    searchResultsContextPrompt = `The following search results were found user's query.
<PossiblyRelevantPosts>${formattedPostsFromQueryMatch.join('\n')}</PossiblyRelevantPosts>
- Not all results may be relevant. Ignore relevant results and use only those that seem relevant to you, if any.
- Refer to the search results as "possible relevant posts".
- Cite the results you use with the following format: [Post Title](https//lesswrong.com/posts/<postId>). The postId is given in the search results. Ensure you also give the displayName of the author.
`
  }
  
  const promptIntro = `<SystemInstruction>A reader of LessWrong.com is asking you a question. The following context is provided to help you answer it.\n`
  const promptQueryAndInstructions = `In responding to the user query, please follow these instructions:
- You may have been provided additional context such PossiblyRelevantPosts or the UsersCurrentPost. If relevant, use this context to help you answer the query.
- You may also use your own knowledge and experience to answer the query, but prioritize using provided context.
- Limit the use of lists and bullet points in your answer, prefer to answer with paragraphs. 
- When citing results, give at least one word-for-word exact quote from what you are citing.
- Format paragraph or block quotes using Markdown syntax, i.e. start them with a >. Do not wrap the contents of block quotes in "" (quotes).
- The context loaded to you is formatted in Markdown.
- Please format your response using Markdown syntax.
- When writing equations, format them using Markdown MathJax syntax. No need to mention this to the user.
- If you are not confident in your answer, e.g. what something means or if you unsure, it is better to say you are unsure or don't know than to guess.
</SystemInstruction>\n\n
${query}
`

const compiledPrompt = `${promptIntro}\n${postContextPrompt}${searchResultsContextPrompt}${promptQueryAndInstructions}`

  console.log("Number of posts returned and their titles", nearestPosts.length, nearestPosts.map(post => post.title))
  //print to the console the first 1000 characters and last 1000 characters of the prompt
  console.log(compiledPrompt.slice(0, 1000))
  console.log(compiledPrompt.slice(-2000))

  return { queryWithContext: compiledPrompt, postsLoadedIntoContext: nearestPosts }    
}

defineMutation({
  name: 'sendClaudeMessage',
  schema: `${ClaudeMessage}\n${PromptContextOptions}`,
  argTypes: '(messages: [ClaudeMessage!]!, promptContextOptions: PromptContextOptions!, title: String)',
  resultType: 'JSON',
  fn: async (_, {messages, promptContextOptions, title }: {messages: ClaudeMessage[], promptContextOptions: PromptContextOptions, title: string|null}, context): Promise<ClaudeConversation> => {
    const { currentUser } = context;
    if (!userIsAdmin(currentUser)) {
      throw new Error("only admins can use Claude chat at present")
    }

    // Check that conversation history past in conforms to schema
    const parsedMessagesWrapper = claudeMessagesSchema.safeParse(messages)

    if (!parsedMessagesWrapper.success) {
      throw new Error("role must be either user or assistant")
    }

    const client = getAnthropicClientOrThrow()

    const validatedMessages = parsedMessagesWrapper.data
    const firstQuery = validatedMessages.filter(message => message.role === 'user')[0]
    const isFirstMessage = validatedMessages.length === 1

    // Get post context if exists and is needed
    let currentPost = (!title || isFirstMessage) && promptContextOptions?.postId ? await context.loaders.Posts.load(promptContextOptions.postId) : undefined
    if (currentPost && !currentPost.author) {
      const author = await context.loaders.Users.load(currentPost.userId)
      const authorName = author.displayName ?? author.username // TODO: If using on AF, use full name
      currentPost = {...currentPost, author: authorName}
    }


    // Generate title for the converation (there shouldn't be a first message with a title already, but if there is, don't overwrite it)
    let newTitle = title
    if (!title) {

      // TODO: actually feed post or post title into this prompt()
    const titleGenerationPrompt = `A user has started a new converation with you, Claude. 
Please generate a short title for this converation based on the first messate. The first message is as follows: ${firstQuery.content}
The tile should be a short phrase of 2-4 words that captures the essence of the conversation.
Do not include the word "title" or similar in your response.
Do not wrap your answer in quotes or brackets.
${currentPost ? `The user is currently viewing the following post ${currentPost.title}. Reference it if relevant` : ""}
`

    // TODO: This can probably be done in parallel with the rest of the conversation 
    const titleResult = await client.messages.create({
      model: "claude-3-haiku-20240307",
      max_tokens: 50,
      messages: [{role: "user", content: titleGenerationPrompt}]
    })

    const titleResponse = titleResult.content[0]
    if (titleResponse.type === 'tool_use') {
      throw new Error("response is tool use which is not a proper response in this context")
    }
    newTitle = titleResponse.text
  }

  // just in case the title is still empty
  if (!newTitle) {
    // Converation with Claude plus date in YY-MM-DD format
    newTitle = `Conversation with Claude ${new Date().toISOString().slice(0, 10)}`
  }


    // Determine whether to use RAG or not
    const isRagFirstMessage = isFirstMessage

    if  (isRagFirstMessage){
      const { queryWithContext, postsLoadedIntoContext } = await createPromptWithContext({...promptContextOptions, post: currentPost}, context)
      //TODO: also mention loading current post context
      const prefix = `*Based on your query, the following posts were loaded into the LLM's context window*:`
      const allLoadedPosts = currentPost ? [currentPost, ...postsLoadedIntoContext] : postsLoadedIntoContext;
      // TODO: is this okay? freaking underscore and lodash weren't working for me
      const uniquePosts: DbPost[] = Array.from(new Set(allLoadedPosts.map(post => post._id))).map(postId => allLoadedPosts.find(post => post._id === postId) as DbPost)
      const listOfPosts = uniquePosts.map(post => `- *[${post.title}](${postGetPageUrl(post)}) by ${post.author}*`).join("\n")
      const displayContent = await markdownToHtml(`${prefix}\n${listOfPosts}\n\n\n*You asked:*\n\n${firstQuery.content}`) 

      console.log({displayContent})
      
      firstQuery.displayContent || firstQuery.content

      // replace the first message in validateMessages with queryWithContext
      validatedMessages[0] = {
        role: firstQuery.role,
        content: queryWithContext,
        displayContent
      }
    }

    const validatedMessagesWithoutDisplayContent = validatedMessages.map(({role, content}) => ({role, content}))


    const result = await client.messages.create({
      model: "claude-3-5-sonnet-20240620",
      max_tokens: 4096,
      messages: validatedMessagesWithoutDisplayContent
    })

    const response = result.content[0]

    if (response.type === 'tool_use') {
      throw new Error("response is tool use which is not a proper response in this context")
    }

    const responseHtml = await markdownToHtml(response.text)

    const updatedMessages = [...validatedMessages, { role: "assistant", content: response.text, displayContent: responseHtml }]

    return { messages: updatedMessages, title: newTitle }
  }
})
