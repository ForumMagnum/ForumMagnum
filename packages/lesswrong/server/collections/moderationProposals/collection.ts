import schema from '@/lib/collections/moderationProposals/newSchema';
import { createCollection } from "@/lib/vulcan-lib/collections.ts";
import { DatabaseIndexSet } from "@/lib/utils/databaseIndexSet";

export const ModerationProposals = createCollection({
  collectionName: "ModerationProposals",
  typeName: "ModerationProposal",
  schema,
  getIndexes: () => {
    const indexSet = new DatabaseIndexSet();
    indexSet.addIndex('ModerationProposals', { targetUserId: 1, status: 1, createdAt: -1 });
    indexSet.addIndex('ModerationProposals', { status: 1, createdAt: -1 });
    return indexSet;
  },
});

export default ModerationProposals;
