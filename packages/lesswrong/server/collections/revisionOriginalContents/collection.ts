import schema from '@/lib/collections/revisionOriginalContents/newSchema';
import { createCollection } from '@/lib/vulcan-lib/collections';
import { DatabaseIndexSet } from '@/lib/utils/databaseIndexSet';

export const RevisionOriginalContents: RevisionOriginalContentsCollection = createCollection({
  collectionName: 'RevisionOriginalContents',
  typeName: 'RevisionOriginalContent',
  schema,
  getIndexes: () => {
    const indexSet = new DatabaseIndexSet();
    return indexSet;
  },
});

export default RevisionOriginalContents;
