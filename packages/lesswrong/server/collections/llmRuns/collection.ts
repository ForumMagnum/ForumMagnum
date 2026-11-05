import schema from '@/lib/collections/llmRuns/newSchema';
import { createCollection } from '@/lib/vulcan-lib/collections';
import { DatabaseIndexSet } from '@/lib/utils/databaseIndexSet';

export const LlmRuns: LlmRunsCollection = createCollection({
  collectionName: 'LlmRuns',
  typeName: 'LlmRun',
  schema,

  getIndexes: () => {
    const indexSet = new DatabaseIndexSet();
    indexSet.addIndex('LlmRuns', { status: 1, createdAt: 1 });
    return indexSet;
  },
});

export default LlmRuns;
