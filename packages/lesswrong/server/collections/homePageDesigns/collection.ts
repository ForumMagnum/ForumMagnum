import schema from '@/lib/collections/homePageDesigns/newSchema';
import { createCollection } from '@/lib/vulcan-lib/collections';
import { DatabaseIndexSet } from '@/lib/utils/databaseIndexSet';

export const HomePageDesigns: HomePageDesignsCollection = createCollection({
  collectionName: 'HomePageDesigns',
  typeName: 'HomePageDesign',
  schema,

  getIndexes: () => {
    const indexSet = new DatabaseIndexSet();
    // Look up revisions by publicId, newest first
    indexSet.addIndex('HomePageDesigns', { publicId: 1, createdAt: -1 });
    // Look up designs by owner (userId or clientId)
    indexSet.addIndex('HomePageDesigns', { ownerId: 1, createdAt: -1 });
    // Look up published designs (for gallery/marketplace)
    indexSet.addIndex('HomePageDesigns', { commentId: 1 });
    return indexSet;
  },
});


export default HomePageDesigns;
