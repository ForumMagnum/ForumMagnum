import { createCollection } from "@/lib/vulcan-lib/collections.ts";
import schema from "@/lib/collections/llmMessages/schema"
import { isAdmin, userOwns } from "@/lib/vulcan-users/permissions.ts";
import { DatabaseIndexSet } from "@/lib/utils/databaseIndexSet";

export const LlmMessages: LlmMessagesCollection = createCollection({
  collectionName: "LlmMessages",
  typeName: "LlmMessage",
  schema,
  getIndexes: () => {
    const indexSet = new DatabaseIndexSet();
    indexSet.addIndex('LlmMessages', { conversationId: 1, createdAt: 1 });
    return indexSet;
  },
  logChanges: true,
});

LlmMessages.checkAccess = async (user, llmConversation) => {
  return isAdmin(user) || userOwns(user, llmConversation);
};

export default LlmMessages;
