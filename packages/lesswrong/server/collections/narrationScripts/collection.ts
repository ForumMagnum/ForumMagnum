import schema from '@/lib/collections/narrationScripts/newSchema';
import { createCollection } from '@/lib/vulcan-lib/collections';
import { DatabaseIndexSet } from '@/lib/utils/databaseIndexSet';

export const NarrationScripts: NarrationScriptsCollection = createCollection({
  collectionName: 'NarrationScripts',
  typeName: 'NarrationScript',
  schema,

  getIndexes: () => {
    const indexSet = new DatabaseIndexSet();
    indexSet.addIndex('NarrationScripts', { revisionId: 1, preprocessorVersion: 1, introduction: 1 }, { unique: true });
    return indexSet;
  },
});

export default NarrationScripts;
