import { createCollection } from '@/lib/vulcan-lib/collections';
import { DatabaseIndexSet } from '@/lib/utils/databaseIndexSet';

// Following the simpler pattern from UltraFeedEvents/collection.ts
export const Bookmarks: BookmarksCollection = createCollection({
  collectionName: 'Bookmarks',
  typeName: 'Bookmark',
  getIndexes: () => {
    const indexSet = new DatabaseIndexSet();
    indexSet.addIndex('Bookmarks', { "userId": 1, "documentId": 1, "collectionName": 1 })
    indexSet.addIndex('Bookmarks', { "userId": 1, "createdAt": -1 })
    return indexSet;
  },
});

