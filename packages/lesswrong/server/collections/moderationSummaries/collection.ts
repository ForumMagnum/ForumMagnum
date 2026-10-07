import schema from '@/lib/collections/moderationSummaries/newSchema';
import { createCollection } from "@/lib/vulcan-lib/collections.ts";
import { DatabaseIndexSet } from "@/lib/utils/databaseIndexSet";

export const ModerationSummaries = createCollection({
  collectionName: "ModerationSummaries",
  typeName: "ModerationSummary",
  schema,
  getIndexes: () => {
    const indexSet = new DatabaseIndexSet();
    indexSet.addIndex('ModerationSummaries', { targetUserId: 1, kind: 1, createdAt: -1 });
    indexSet.addIndex('ModerationSummaries', { kind: 1, deleted: 1, createdAt: -1 });
    return indexSet;
  },
});

export default ModerationSummaries;
