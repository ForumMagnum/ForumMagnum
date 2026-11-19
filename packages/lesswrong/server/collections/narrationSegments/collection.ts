import schema from '@/lib/collections/narrationSegments/newSchema';
import { createCollection } from '@/lib/vulcan-lib/collections';
import { DatabaseIndexSet } from '@/lib/utils/databaseIndexSet';

export const NarrationSegments: NarrationSegmentsCollection = createCollection({
  collectionName: 'NarrationSegments',
  typeName: 'NarrationSegment',
  schema,

  getIndexes: () => {
    const indexSet = new DatabaseIndexSet();
    indexSet.addIndex('NarrationSegments', { narrationScriptId: 1, segmentIndex: 1 }, { unique: true });
    return indexSet;
  },
});

export default NarrationSegments;
