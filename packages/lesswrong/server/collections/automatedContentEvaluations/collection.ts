import { createCollection } from '@/lib/vulcan-lib/collections';
import { DatabaseIndexSet } from '@/lib/utils/databaseIndexSet';
import '@/lib/collections/automatedContentEvaluations/fragments'

export const AutomatedContentEvaluations: AutomatedContentEvaluationsCollection = createCollection({
  collectionName: 'AutomatedContentEvaluations',
  typeName: 'AutomatedContentEvaluation',

  // This is where you can add indexes for the collection.
  getIndexes: () => {
    const indexSet = new DatabaseIndexSet();
    indexSet.addIndex("AutomatedContentEvaluations", {revisionId: 1});
    return indexSet;
  },
});


export default AutomatedContentEvaluations;
