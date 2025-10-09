import schema from '@/lib/collections/inlinePredictions/newSchema';
import { createCollection } from '@/lib/vulcan-lib/collections';
import { DatabaseIndexSet } from '@/lib/utils/databaseIndexSet';

export const InlinePredictions: InlinePredictionsCollection = createCollection({
  collectionName: 'InlinePredictions',
  typeName: 'InlinePrediction',
  schema,

  // This is where you can add indexes for the collection.
  getIndexes: () => {
    const indexSet = new DatabaseIndexSet();
    indexSet.addIndex("InlinePredictions", { documentId: 1 });
    indexSet.addIndex("InlinePredictions", { userId: 1 });
    indexSet.addIndex("InlinePredictions", { questionId: 1 });
    return indexSet;
  },
});


export default InlinePredictions;
