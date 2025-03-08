import { createCollection } from "@/lib/vulcan-lib/collections.ts";
import schema from "@/lib/collections/llmConversations/schema";
import { getDefaultMutations } from '@/server/resolvers/defaultMutations';
import { getDefaultResolvers } from "@/lib/vulcan-core/default_resolvers.ts";
import { DatabaseIndexSet } from "@/lib/utils/databaseIndexSet";

export const LlmConversations: LlmConversationsCollection = createCollection({
  collectionName: "LlmConversations",
  typeName: "LlmConversation",
  schema,
  getIndexes: () => {
    const indexSet = new DatabaseIndexSet();
    indexSet.addIndex('LlmConversations', { userId: 1, deleted: 1, createdAt: 1 });
    return indexSet;
  },
  logChanges: true,
  resolvers: getDefaultResolvers('LlmConversations'),
  mutations: getDefaultMutations('LlmConversations', {
    newCheck: (user, document) => {
      return false
    },
    removeCheck: (user, document) => {
      return false
    }
  }),
});

export default LlmConversations;
