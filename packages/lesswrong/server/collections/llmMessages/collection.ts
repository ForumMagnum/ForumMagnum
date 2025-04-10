import { createCollection } from "@/lib/vulcan-lib/collections.ts";
import { DatabaseIndexSet } from "@/lib/utils/databaseIndexSet";

export const LlmMessages: LlmMessagesCollection = createCollection({
  collectionName: "LlmMessages",
  typeName: "LlmMessage",
    getIndexes: () => {
    const indexSet = new DatabaseIndexSet();
    indexSet.addIndex('LlmMessages', { conversationId: 1, createdAt: 1 });
    return indexSet;
  },
});

export default LlmMessages;
