import { z } from "zod";

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
