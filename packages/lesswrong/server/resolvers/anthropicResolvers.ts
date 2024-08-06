import { userIsAdmin } from "@/lib/vulcan-users";
import { defineMutation } from "../utils/serverGraphqlUtil";
import { addGraphQLSchema } from "../vulcan-lib";
import { getAnthropicClientOrThrow } from "../languageModels/anthropicClient";
import { z } from 'zod'
import { getEmbeddingsFromApi } from "../embeddings";
import { contentTypes } from "@/components/posts/PostsPage/ContentType";
import { dataToMarkdown, markdownToHtml } from "../editor/conversionUtils";
import { postGetPageUrl } from "@/lib/collections/posts/helpers";

const ClaudeMessage = `input ClaudeMessage {
  role: String!
  content: String!
  displayContent: String
}`

interface ClaudeMessage {
  role: string
  content: string
  displayContent?: string
}

const claudeMessageSchema = z.object({
  role: z.union([z.literal('user'), z.literal('assistant')]),
  content: z.string(),
  displayContent: z.optional(z.string())
})

const claudeMessagesSchema = z.array(claudeMessageSchema)


const createPromptWithContext = async (query: string, context: ResolverContext) => {

  const { embeddings } = await getEmbeddingsFromApi(query)
  const nearestPosts = await context.repos.postEmbeddings.getNearestPostsWeightedByQuality(embeddings)

  const processedPosts = nearestPosts.map((post, index) => {
    const originalContents = post.contents?.originalContents
    if (!originalContents) {
      return undefined
    }
    const markdown = dataToMarkdown(originalContents.data, originalContents.type)

    return `
Search Result #${index}
postId: ${post._id}
Title: ${post.title}
displayName: ${post.author}
Publish Date: ${post.postedAt}
Score: ${post.baseScore}

${markdown}`
  })

  const prompt = `
    <search_results>${processedPosts.join('\n')}</search_results>
    Using the search results provided, please answer the following query.
    <query>${query}</query>
    - Not all results may be relevant. Ignore relevant results and use only those that seem relevant to you, if any.
    - You may use answer independent from results to answer the query, but prioritize knowledge from the search results. Do not mention the search results in your answer.
    - Limit the use of lists and bullet points in your answer, prefer to answer with paragraphs. 
    - Cite the results you use with the following format: [Post Title](https//lesswrong.com/posts/<postId>). The postId is given in the search results. Ensure you also give the displayName of the author.
    - When citing results, give at least one word-for-word exact quote from the post.
    - Format your answer using Markdown syntax.
    - If you are not confident in your answer, e.g. what something means or if you unsure, it is better to say so than to guess.
    `

  console.log("Number of posts returned and their titles", nearestPosts.length, nearestPosts.map(post => post.title))
  //print to the console the first 1000 characters and last 1000 characters of the prompt
  console.log(prompt.slice(0, 1000))
  console.log(prompt.slice(-2000))

  return { queryWithContext: prompt, postsLoadedIntoContext: nearestPosts }    
}

defineMutation({
  name: 'sendClaudeMessage',
  schema: ClaudeMessage,
  argTypes: '(messages: [ClaudeMessage!]!, useRag: Boolean)',
  resultType: 'JSON',
  fn: async (_, {messages, useRag}: {messages: ClaudeMessage[], useRag: boolean|null}, context): Promise<ClaudeMessage[]> => {
    const { currentUser } = context;
    if (!userIsAdmin(currentUser)) {
      throw new Error("only admins can use Claude chat at present")
    }

    const parsedMessagesWrapper = claudeMessagesSchema.safeParse(messages)

    if (!parsedMessagesWrapper.success) {
      throw new Error("role must be either user or assistant")
    }

    // Determine whether to use RAG or not
    const validatedMessages = parsedMessagesWrapper.data
    console.log({useRag, validatedMessagesLength: validatedMessages.length})
    const isRagFirstMessage = (useRag && validatedMessages.length === 1)


    if  (isRagFirstMessage){
      const firstQuery = validatedMessages[0]
      const { queryWithContext, postsLoadedIntoContext } = await createPromptWithContext(firstQuery.content, context)
      const prefix = `*Based on your query, the following posts were loaded into the LLM's context window*:`
      const listOfPosts = postsLoadedIntoContext.map(post => `- *[${post.title}](${postGetPageUrl(post)}) by ${post.author}*`).join("\n")
      const displayContent = await markdownToHtml(`${prefix}\n${listOfPosts}\n\n\n${firstQuery.content}`) 

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

    const client = getAnthropicClientOrThrow()

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

    return updatedMessages
  }
})
