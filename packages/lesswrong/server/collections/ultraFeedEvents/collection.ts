import { createCollection } from '@/lib/vulcan-lib/collections';
import { DatabaseIndexSet } from '@/lib/utils/databaseIndexSet';
import { getDefaultMutations } from '@/server/resolvers/defaultMutations';

const mutationOptions = {
  newCheck: async (user: DbUser | null, document: DbUltraFeedEvent | null, context: ResolverContext) => {
    return !!user;
  },
  editCheck: async (user: DbUser | null, document: DbUltraFeedEvent | null, context: ResolverContext) => {
    return false;
  },
  removeCheck: async (user: DbUser | null, document: DbUltraFeedEvent | null, context: ResolverContext) => {
    return false;
  },
  update: false,
};

export const UltraFeedEvents: UltraFeedEventsCollection = createCollection({
  collectionName: 'UltraFeedEvents',
  typeName: 'UltraFeedEvent',

  getIndexes: () => {
    const indexSet = new DatabaseIndexSet();
    indexSet.addIndex('UltraFeedEvents', {documentId: 1, userId: 1, eventType: 1, createdAt: 1}, {name: "ultraFeedEvents_document_user_event_createdAt"});
    return indexSet;
  },

  mutations: getDefaultMutations('UltraFeedEvents', mutationOptions),
});

export default UltraFeedEvents;
