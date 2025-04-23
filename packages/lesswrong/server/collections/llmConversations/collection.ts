import { createCollection } from "@/lib/vulcan-lib/collections.ts";
import { DatabaseIndexSet } from "@/lib/utils/databaseIndexSet";

export const LlmConversations: LlmConversationsCollection = createCollection({
  collectionName: "LlmConversations",
  typeName: "LlmConversation",
    getIndexes: () => {
    const indexSet = new DatabaseIndexSet();
    indexSet.addIndex('LlmConversations', { userId: 1, deleted: 1, createdAt: 1 });
    return indexSet;
  },
});

export default LlmConversations;
