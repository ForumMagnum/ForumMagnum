import schema from './schema';
import { createCollection } from '../../vulcan-lib/collections';
import { getDefaultMutations } from '../../vulcan-core/default_mutations';
import { addUniversalFields } from "../../collectionUtils";
import { getDefaultResolvers } from "../../vulcan-core/default_resolvers";
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

addUniversalFields({collection: AdvisorRequests})

export default AdvisorRequests;
