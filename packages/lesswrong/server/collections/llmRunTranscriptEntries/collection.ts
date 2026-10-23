import schema from '@/lib/collections/llmRunTranscriptEntries/newSchema';
import { createCollection } from '@/lib/vulcan-lib/collections';
import { DatabaseIndexSet } from '@/lib/utils/databaseIndexSet';

export const LlmRunTranscriptEntries: LlmRunTranscriptEntriesCollection = createCollection({
  collectionName: 'LlmRunTranscriptEntries',
  typeName: 'LlmRunTranscriptEntry',
  schema,

  getIndexes: () => {
    const indexSet = new DatabaseIndexSet();
    indexSet.addIndex('LlmRunTranscriptEntries', { llmRunId: 1, attempt: 1, index: 1 });
    return indexSet;
  },
});

export default LlmRunTranscriptEntries;
