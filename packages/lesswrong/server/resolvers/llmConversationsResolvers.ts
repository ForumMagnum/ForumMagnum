import LlmConversations from "@/lib/collections/llmConversations/collection";
import { augmentFieldsDict } from "@/lib/utils/schemaUtils";
import { markdownToHtml } from "../editor/conversionUtils";

augmentFieldsDict(LlmConversations, {
  messages: {
    resolveAs: {
      type: '[LlmMessage]',
      resolver: async (document, args, context): Promise<DbLlmMessage[]> => {
        const { LlmMessages } = context;
        const messages = await LlmMessages.find({conversationId: document._id}).fetch();
        const messagesHtml = await Promise.all(messages.map(async (message) => ({
          ...message, content: await markdownToHtml(message.content)
        })));

        return messagesHtml
      },
    }
  },
})

