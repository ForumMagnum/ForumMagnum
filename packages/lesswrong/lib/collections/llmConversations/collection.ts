import { addUniversalFields } from "@/lib/collectionUtils";
import { createCollection } from "@/lib/vulcan-lib";
import schema from "../llmConversations/schema";


const LlmConversations: LlmConversationsCollection = createCollection({
  collectionName: "LlmConversations",
  typeName: "LlmConversation",
  schema,
  logChanges: true,
});

addUniversalFields({
  collection: LlmConversations,
});

// TODO: ensure index?

export default LlmConversations;
