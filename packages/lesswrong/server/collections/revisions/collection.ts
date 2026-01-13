import schema from '@/lib/collections/revisions/newSchema';
import { DatabaseIndexSet } from '@/lib/utils/databaseIndexSet';
import { createCollection } from "@/lib/vulcan-lib/collections";

export const Revisions = createCollection({
  collectionName: 'Revisions',
  typeName: 'Revision',
  schema,
  getIndexes: () => {
    const indexSet = new DatabaseIndexSet();
    indexSet.addIndex("Revisions", {userId: 1, collectionName: 1, editedAt: 1});
    indexSet.addIndex("Revisions", {collectionName:1, fieldName:1, editedAt:1, _id: 1, changeMetrics:1});
    indexSet.addIndex("Revisions", {documentId: 1, version: 1, fieldName: 1, editedAt: 1})
    return indexSet;
  },
  voteable: {
    timeDecayScoresCronjob: false,
  },
});

export interface ChangeMetrics {
  added: number
  removed: number
}

export default Revisions;
