import { addUniversalFields, getDefaultMutations, getDefaultResolvers } from "@/lib/collectionUtils";
import { createCollection } from "@/lib/vulcan-lib";
import schema from "./schema";


const LlmConversations: LlmConversationsCollection = createCollection({
  collectionName: "LlmConversations",
  typeName: "LlmConversation",
  schema,
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

// TODO: ensure index?

export default LlmConversations;
