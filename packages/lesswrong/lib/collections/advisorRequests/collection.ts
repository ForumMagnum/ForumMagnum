import schema from './schema';
import { createCollection } from '../../vulcan-lib';
import { addUniversalFields, getDefaultResolvers } from '../../collectionUtils'
import { getDefaultMutations } from '../../vulcan-core/default_mutations';

export const AdvisorRequests: AdvisorRequestsCollection = createCollection({
  collectionName: 'AdvisorRequests',
  typeName: 'AdvisorRequest',
  schema,
  resolvers: getDefaultResolvers('AdvisorRequests'),
  mutations: getDefaultMutations('AdvisorRequests'),
  logChanges: true,
});

addUniversalFields({collection: AdvisorRequests})

export default AdvisorRequests;
