import { createCollection } from '@/lib/vulcan-lib/collections';
import '@/lib/collections/tagFlags/fragments'
import { DatabaseIndexSet } from '@/lib/utils/databaseIndexSet';


export const TagFlags: TagFlagsCollection = createCollection({
  collectionName: 'TagFlags',
  typeName: 'TagFlag',
    getIndexes: () => {
    const indexSet = new DatabaseIndexSet();
    indexSet.addIndex('TagFlags', {deleted: 1, order: 1, name: 1});
    return indexSet;
  },
  logChanges: true,
});


export default TagFlags;

