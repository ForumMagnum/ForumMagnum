import schema from '@/lib/collections/fieldChanges/newSchema';
import { createCollection } from '@/lib/vulcan-lib/collections';
import { DatabaseIndexSet } from '@/lib/utils/databaseIndexSet';

export const FieldChanges = createCollection({
  collectionName: "FieldChanges",
  typeName: "FieldChange",
  schema,
  getIndexes: () => {
    const indexSet = new DatabaseIndexSet();
    indexSet.addIndex('FieldChanges', { documentId: 1, createdAt: 1 })
    indexSet.addIndex('FieldChanges', { userId: 1, createdAt: 1 })
    return indexSet;
  },
});
