import { userIsAdmin } from "@/lib/vulcan-users";
import { defineMutation } from "../utils/serverGraphqlUtil";
import { addGraphQLSchema } from "../vulcan-lib";
import { getAnthropicClientOrThrow } from "../languageModels/anthropicClient";
import { z } from 'zod'

const ClaudeMessage = `type ClaudeMessage {
  role: String!
  content: String!
}`

addGraphQLSchema(ClaudeMessage)

interface ClaudeMessage {
  role: string
  content: string
}

const claudeMessageSchema = z.object({
  role: z.union([z.literal('user'), z.literal('assistant')]),
  content: z.string()
})

const claudeMessagesSchema = z.array(claudeMessageSchema)

defineMutation({
  name: 'sendClaudeMessage',
  argTypes: '(messages: [ClaudeMessage!]!)',
  resultType: 'String',
  fn: async (_, {messages}: {messages: ClaudeMessage[]}, context) => {
    const { currentUser } = context;
    if (!userIsAdmin(currentUser)) {
      throw new Error("only admins can use Claude chat at present")
    }

    const validatedMessages = claudeMessagesSchema.safeParse(messages)

    if (!validatedMessages.success) {
      throw new Error("role must be either user or assistant")
    }

    const client = getAnthropicClientOrThrow()

    const result = await client.messages.create({
      model: "claude-3-5-sonnet-20240620",
      max_tokens: 2048,
      messages: validatedMessages.data
    })

    const response = result.content[0]

    if (response.type === 'tool_use') {
      throw new Error("response is tool use which is not a proper response in this context")
    }

    return response.text
  }
})
