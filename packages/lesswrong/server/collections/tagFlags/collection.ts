import schema from '@/lib/collections/tagFlags/newSchema';
import { createCollection } from '@/lib/vulcan-lib/collections';
import '@/lib/collections/tagFlags/fragments'
import { DatabaseIndexSet } from '@/lib/utils/databaseIndexSet';


export const TagFlags = createCollection({
  collectionName: 'TagFlags',
  typeName: 'TagFlag',
  schema,
    getIndexes: () => {
    const indexSet = new DatabaseIndexSet();
    indexSet.addIndex('TagFlags', {deleted: 1, order: 1, name: 1});
    return indexSet;
  },
});


export default TagFlags;

