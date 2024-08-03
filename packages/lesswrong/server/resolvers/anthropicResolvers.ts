import { userIsAdmin } from "@/lib/vulcan-users";
import { defineMutation } from "../utils/serverGraphqlUtil";
import { addGraphQLSchema } from "../vulcan-lib";
import { getAnthropicClientOrThrow } from "../languageModels/anthropicClient";
import { z } from 'zod'
import { getEmbeddingsFromApi } from "../embeddings";
import { contentTypes } from "@/components/posts/PostsPage/ContentType";
import { dataToMarkdown } from "../editor/conversionUtils";

const ClaudeMessage = `input ClaudeMessage {
  role: String!
  content: String!
}`

interface ClaudeMessage {
  role: string
  content: string
}

const claudeMessageSchema = z.object({
  role: z.union([z.literal('user'), z.literal('assistant')]),
  content: z.string()
})

const claudeMessagesSchema = z.array(claudeMessageSchema)


const createPromptWithContext = async (query: string, context: ResolverContext) => {

  const { embeddings } = await getEmbeddingsFromApi(query)
  const nearestPosts = await context.repos.postEmbeddings.getNearestPostsWeightedByQuality(embeddings)

  const processedPosts = nearestPosts.map(post => {
    const originalContents = post.contents?.originalContents
    if (!originalContents) {
      return undefined
    }
    const markdown = dataToMarkdown(originalContents.data, originalContents.type)

    



  
  //convert query to embedding
  //find nearest posts
  //format posts into text
  //combine into final prompt

}

defineMutation({
  name: 'sendClaudeMessage',
  schema: ClaudeMessage,
  argTypes: '(messages: [ClaudeMessage!]!, useRag: Boolean)',
  resultType: 'String',
  fn: async (_, {messages, useRag}: {messages: ClaudeMessage[], useRag: boolean|null}, context) => {
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
    if (useRag && validatedMessages.length === 1) {
      const firstMessage = validatedMessages[0]




    }



    const client = getAnthropicClientOrThrow()

    const result = await client.messages.create({
      model: "claude-3-5-sonnet-20240620",
      max_tokens: 2048,
      messages: validatedMessages
    })

    const response = result.content[0]

    if (response.type === 'tool_use') {
      throw new Error("response is tool use which is not a proper response in this context")
    }

    return response.text
  }
})
