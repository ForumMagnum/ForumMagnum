import schema from '@/lib/collections/llmMessages/newSchema';
import { createCollection } from "@/lib/vulcan-lib/collections.ts";
import { DatabaseIndexSet } from "@/lib/utils/databaseIndexSet";

export const LlmMessages = createCollection({
  collectionName: "LlmMessages",
  typeName: "LlmMessage",
  schema,
    getIndexes: () => {
    const indexSet = new DatabaseIndexSet();
    indexSet.addIndex('LlmMessages', { conversationId: 1, createdAt: 1 });
    return indexSet;
  },
});

export default LlmMessages;
