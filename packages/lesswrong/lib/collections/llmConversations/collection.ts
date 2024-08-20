import { addUniversalFields, getDefaultResolvers } from "@/lib/collectionUtils";
import { createCollection } from "@/lib/vulcan-lib";
import schema from "./schema";


const LlmConversations: LlmConversationsCollection = createCollection({
  collectionName: "LlmConversations",
  typeName: "LlmConversation",
  schema,
  logChanges: true,
  resolvers: getDefaultResolvers('LlmConversations')
});

addUniversalFields({
  collection: LlmConversations,
});

// TODO: ensure index?

export default LlmConversations;
