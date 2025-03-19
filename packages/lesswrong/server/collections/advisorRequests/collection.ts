import schema from '@/lib/collections/advisorRequests/schema';
import { createCollection } from '@/lib/vulcan-lib/collections';
import { getDefaultMutations } from '@/server/resolvers/defaultMutations';
import { getDefaultResolvers } from "@/server/resolvers/defaultResolvers";
import { DatabaseIndexSet } from '@/lib/utils/databaseIndexSet';

export const AdvisorRequests: AdvisorRequestsCollection = createCollection({
  collectionName: 'AdvisorRequests',
  typeName: 'AdvisorRequest',
  schema,
  getIndexes: () => {
    const indexSet = new DatabaseIndexSet();
    indexSet.addIndex('AdvisorRequests', { userId: 1 })
    return indexSet;
  },
  resolvers: getDefaultResolvers('AdvisorRequests'),
  mutations: getDefaultMutations('AdvisorRequests'),
  logChanges: true,
});


export default AdvisorRequests;
