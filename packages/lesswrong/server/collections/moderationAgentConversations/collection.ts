import schema from '@/lib/collections/moderationAgentConversations/newSchema';
import { createCollection } from "@/lib/vulcan-lib/collections.ts";
import { DatabaseIndexSet } from "@/lib/utils/databaseIndexSet";

export const ModerationAgentConversations = createCollection({
  collectionName: "ModerationAgentConversations",
  typeName: "ModerationAgentConversation",
  schema,
  getIndexes: () => {
    const indexSet = new DatabaseIndexSet();
    indexSet.addIndex('ModerationAgentConversations', { targetUserId: 1, createdAt: -1 });
    return indexSet;
  },
});

export default ModerationAgentConversations;
