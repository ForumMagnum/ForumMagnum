import { createCollection } from "@/lib/vulcan-lib/collections.ts";
import { getDefaultResolvers } from "@/server/resolvers/defaultResolvers.ts";
import { DatabaseIndexSet } from "@/lib/utils/databaseIndexSet";

export const LlmConversations: LlmConversationsCollection = createCollection({
  collectionName: "LlmConversations",
  typeName: "LlmConversation",
    getIndexes: () => {
    const indexSet = new DatabaseIndexSet();
    indexSet.addIndex('LlmConversations', { userId: 1, deleted: 1, createdAt: 1 });
    return indexSet;
  },
  logChanges: true,
  resolvers: getDefaultResolvers('LlmConversations'),
});

export default LlmConversations;
