import { createCollection } from '@/lib/vulcan-lib/collections';
import { DatabaseIndexSet } from '@/lib/utils/databaseIndexSet';

/**
 * If this collection wants to allow users to create/update records, uncomment the following lines
 * and implement the check functions for newCheck, editCheck, and removeCheck.  (removeCheck should by default return false.)
 * Otherwise, delete this block.
 */
// const mutationOptions = {
//   newCheck: async (user: DbUser | null, document: DbUltraFeedEvent | null, context: ResolverContext) => {
//     return false;
//   },
//   editCheck: async (user: DbUser | null, document: DbUltraFeedEvent | null, context: ResolverContext) => {
//     return false;
//   },
//   removeCheck: async (user: DbUser | null, document: DbUltraFeedEvent | null, context: ResolverContext) => {
//     return false;
//   },
// };

export const UltraFeedEvents: UltraFeedEventsCollection = createCollection({
  collectionName: 'UltraFeedEvents',
  typeName: 'UltraFeedEvent',

  // This is where you can add indexes for the collection.
  getIndexes: () => {
    const indexSet = new DatabaseIndexSet();
    return indexSet;
  },

  /** 
   * If this collection wants to be used for basic CRUD operations, uncomment the following lines and import the necessary functions.
   * Otherwise, remove them.
   */
  // resolvers: getDefaultResolvers('ultraFeedEvents'),
  // mutations: getDefaultMutations('ultraFeedEvents', mutationOptions),

  /**
   * If you want to log field changes by default for all fields in this collection, uncomment the following line.
   * Otherwise, remove it.  You can also set logChanges to true for specific fields in the schema.
   */
  // logChanges: true,
});


export default UltraFeedEvents;
