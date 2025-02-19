import { addUniversalFields } from "@/lib/collectionUtils";
import { createCollection } from "@/lib/vulcan-lib";
import schema from "./schema"
import { ensureIndex } from "@/lib/collectionIndexUtils";
import { isAdmin, userOwns } from "@/lib/vulcan-users";

const LlmMessages: LlmMessagesCollection = createCollection({
  collectionName: "LlmMessages",
  typeName: "LlmMessage",
  schema,
  logChanges: true,
});

addUniversalFields({
  collection: LlmMessages,
});

ensureIndex(LlmMessages, { conversationId: 1, createdAt: 1 });

LlmMessages.checkAccess = async (user, llmConversation) => {
  return isAdmin(user) || userOwns(user, llmConversation);
};

export default LlmMessages;
