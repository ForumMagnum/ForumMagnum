import { createCollection } from '@/lib/vulcan-lib/collections';
import { getDefaultMutations, type MutationOptions } from '@/server/resolvers/defaultMutations';
import schema from '@/lib/collections/feedItemServings/schema';
import { getDefaultResolvers } from "@/server/resolvers/defaultResolvers";
import { DatabaseIndexSet } from '@/lib/utils/databaseIndexSet';
import { userIsAdmin } from '@/lib/vulcan-users/permissions';

/**
 * Collection that tracks feed items served to users in UltraFeed and similar feeds.
 * This captures data about which items were sent to the client, regardless of whether
 * they were viewed (impressions).
 * 
 * This collection is primarily written to by the server via the UltraFeed resolver.
 * Clients should not be able to create or modify these records.
 */

// Define mutation options to restrict who can create/edit/delete records
const options: MutationOptions<DbFeedItemServing> = {
  // Disable all mutation types - only server-side code should modify this collection
  create: false,
  update: false,
  upsert: false,
  delete: false
};

// TODO: review what indexes are needed
export const FeedItemServings = createCollection({
  collectionName: 'FeedItemServings',
  typeName: 'FeedItemServing',
  schema,
  getIndexes: () => {
    const indexSet = new DatabaseIndexSet();
    // Index to efficiently retrieve items by session
    indexSet.addIndex('FeedItemServings', { sessionId: 1, position: 1 });
    // Index to efficiently retrieve items by user
    indexSet.addIndex('FeedItemServings', { userId: 1, servedAt: -1 });
    // Updated index to efficiently retrieve and sort user's history
    indexSet.addIndex('FeedItemServings', { userId: 1, servedAt: -1, position: 1 });
    // Index for analytics and lookups by primary document
    indexSet.addIndex('FeedItemServings', { primaryDocumentId: 1, primaryDocumentCollectionName: 1 });
    // Index for time-based queries
    indexSet.addIndex('FeedItemServings', { servedAt: -1 });
    return indexSet;
  },
  resolvers: getDefaultResolvers('FeedItemServings'),
  mutations: getDefaultMutations('FeedItemServings', options),
  logChanges: true,
});

