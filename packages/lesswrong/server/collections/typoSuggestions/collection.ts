import schema from '@/lib/collections/typoSuggestions/newSchema';
import { createCollection } from '@/lib/vulcan-lib/collections';
import { DatabaseIndexSet } from '@/lib/utils/databaseIndexSet';

export const TypoSuggestions = createCollection({
  collectionName: 'TypoSuggestions',
  typeName: 'TypoSuggestion',
  schema,

  getIndexes: () => {
    const indexSet = new DatabaseIndexSet();
    // Dedup: one suggestion per (document, field, quote). Piggybacker reactors
    // hit the unique constraint and silently no-op.
    indexSet.addIndex(
      'TypoSuggestions',
      { documentId: 1, fieldName: 1, quote: 1 },
      { unique: true },
    );
    // Lookup all pending/recent suggestions for a document
    indexSet.addIndex('TypoSuggestions', { documentId: 1, createdAt: -1 });
    // Lookup notifications/dashboards by author
    indexSet.addIndex('TypoSuggestions', { authorId: 1, createdAt: -1 });
    return indexSet;
  },
});

export default TypoSuggestions;
