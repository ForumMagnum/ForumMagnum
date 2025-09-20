import schema from '@/lib/collections/books/newSchema';
import { createCollection } from '@/lib/vulcan-lib/collections';
import { DatabaseIndexSet } from '@/lib/utils/databaseIndexSet';

export const Books = createCollection({
  collectionName: 'Books',
  typeName: 'Book',
  schema,
    getIndexes: () => {
    const indexSet = new DatabaseIndexSet();
    indexSet.addIndex('Books', { collectionId: 1 })
    return indexSet;
  },
});


export default Books;
