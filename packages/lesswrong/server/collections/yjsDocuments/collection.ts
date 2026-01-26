import schema from '@/lib/collections/yjsDocuments/newSchema';
import { createCollection } from '@/lib/vulcan-lib/collections';
import { DatabaseIndexSet } from '@/lib/utils/databaseIndexSet';

export const YjsDocuments: YjsDocumentsCollection = createCollection({
  collectionName: 'YjsDocuments',
  typeName: 'YjsDocument',
  schema,

  // This is where you can add indexes for the collection.
  getIndexes: () => {
    const indexSet = new DatabaseIndexSet();
    indexSet.addIndex('YjsDocuments', { documentId: 1 }, { unique: true });
    return indexSet;
  },
});


export default YjsDocuments;
