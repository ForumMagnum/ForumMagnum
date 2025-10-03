import schema from '@/lib/collections/automatedContentEvaluations/newSchema';
import { createCollection } from '@/lib/vulcan-lib/collections';
import { DatabaseIndexSet } from '@/lib/utils/databaseIndexSet';

export const AutomatedContentEvaluations = createCollection({
  collectionName: 'AutomatedContentEvaluations',
  typeName: 'AutomatedContentEvaluation',
  schema,

  // This is where you can add indexes for the collection.
  getIndexes: () => {
    const indexSet = new DatabaseIndexSet();
    indexSet.addIndex("AutomatedContentEvaluations", {revisionId: 1});
    return indexSet;
  },
});


export default AutomatedContentEvaluations;
