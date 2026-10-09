import schema from '@/lib/collections/moderationLoreDocs/newSchema';
import { createCollection } from "@/lib/vulcan-lib/collections.ts";
import { DatabaseIndexSet } from "@/lib/utils/databaseIndexSet";

export const ModerationLoreDocs = createCollection({
  collectionName: "ModerationLoreDocs",
  typeName: "ModerationLoreDoc",
  schema,
  getIndexes: () => {
    const indexSet = new DatabaseIndexSet();
    indexSet.addIndex('ModerationLoreDocs', { scope: 1, targetUserId: 1, deleted: 1 });
    return indexSet;
  },
});

export default ModerationLoreDocs;
