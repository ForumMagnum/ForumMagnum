import schema from '@/lib/collections/narrationImageDescriptions/newSchema';
import { createCollection } from '@/lib/vulcan-lib/collections';
import { DatabaseIndexSet } from '@/lib/utils/databaseIndexSet';

export const NarrationImageDescriptions: NarrationImageDescriptionsCollection = createCollection({
  collectionName: 'NarrationImageDescriptions',
  typeName: 'NarrationImageDescription',
  schema,

  getIndexes: () => {
    const indexSet = new DatabaseIndexSet();
    indexSet.addIndex('NarrationImageDescriptions', { imageUrl: 1, promptVersion: 1 }, { unique: true });
    return indexSet;
  },
});

export default NarrationImageDescriptions;
