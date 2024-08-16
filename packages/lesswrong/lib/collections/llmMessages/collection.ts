import { addUniversalFields } from "@/lib/collectionUtils";
import { createCollection } from "@/lib/vulcan-lib";
import schema from "./schema"

const LlmMessages: LlmMessagesCollection = createCollection({
  collectionName: "LlmMessages",
  typeName: "LlmMessage",
  schema,
  logChanges: true,
});

addUniversalFields({
  collection: LlmMessages,
});

// TODO: figure out index
//ensureIndex()

export default LlmMessages;
