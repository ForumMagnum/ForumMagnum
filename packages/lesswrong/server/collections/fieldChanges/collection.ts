import { createCollection } from '@/lib/vulcan-lib/collections';
import { DatabaseIndexSet } from '@/lib/utils/databaseIndexSet';
import schema from '@/lib/collections/fieldChanges/schema';

export const FieldChanges = createCollection({
  collectionName: "FieldChanges",
  typeName: "FieldChange",
  schema,
  logChanges: false,
  getIndexes: () => {
    const indexSet = new DatabaseIndexSet();
    indexSet.addIndex('FieldChanges', { documentId: 1, createdAt: 1 })
    indexSet.addIndex('FieldChanges', { userId: 1, createdAt: 1 })
    return indexSet;
  },
});
