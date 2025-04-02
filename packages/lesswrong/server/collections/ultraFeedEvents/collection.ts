import { createCollection } from '@/lib/vulcan-lib/collections';
import { DatabaseIndexSet } from '@/lib/utils/databaseIndexSet';
import { getDefaultMutations } from '@/server/resolvers/defaultMutations';

/**
 * Define mutation options with appropriate permission checks
 */
const mutationOptions = {
  newCheck: async (user: DbUser | null, document: DbUltraFeedEvent | null, context: ResolverContext) => {
    // Allow logged-in users to create events
    return !!user;
  },
  editCheck: async (user: DbUser | null, document: DbUltraFeedEvent | null, context: ResolverContext) => {
    // Generally, events shouldn't be edited
    return false;
  },
  removeCheck: async (user: DbUser | null, document: DbUltraFeedEvent | null, context: ResolverContext) => {
    // Generally, events shouldn't be removed
    return false;
  },
};

export const UltraFeedEvents: UltraFeedEventsCollection = createCollection({
  collectionName: 'UltraFeedEvents',
  typeName: 'UltraFeedEvent',

  // Add indexes for efficient queries
  getIndexes: () => {
    const indexSet = new DatabaseIndexSet();
    indexSet.addIndex('UltraFeedEvents', {documentId: 1, userId: 1, eventType: 1, createdAt: 1}, {name: "ultraFeedEvents_document_user_event_createdAt"});
    return indexSet;
  },

  // Enable default CRUD operations
  mutations: getDefaultMutations('UltraFeedEvents', mutationOptions),

  /**
   * If you want to log field changes by default for all fields in this collection, uncomment the following line.
   * Otherwise, remove it.  You can also set logChanges to true for specific fields in the schema.
   */
  // logChanges: true,
});

export default UltraFeedEvents;
