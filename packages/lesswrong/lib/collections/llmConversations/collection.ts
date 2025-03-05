import { createCollection } from "@/lib/vulcan-lib/collections.ts";
import schema from "./schema";
import { isAdmin, userOwns } from "@/lib/vulcan-users/permissions.ts";
import { addUniversalFields } from "@/lib/collectionUtils";
import { getDefaultMutations } from '@/server/resolvers/defaultMutations';
import { getDefaultResolvers } from "@/lib/vulcan-core/default_resolvers.ts";
import { DatabaseIndexSet } from "@/lib/utils/databaseIndexSet";

const LlmConversations: LlmConversationsCollection = createCollection({
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

addUniversalFields({
  collection: LlmConversations,
});

LlmConversations.checkAccess = async (user, llmConversation) => {
  return isAdmin(user) || userOwns(user, llmConversation);
};

export default LlmConversations;
