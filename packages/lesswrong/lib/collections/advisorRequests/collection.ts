import schema from './schema';
import { createCollection } from '../../vulcan-lib/collections';
import { getDefaultMutations } from '../../vulcan-core/default_mutations';
import { addUniversalFields } from "../../collectionUtils";
import { getDefaultResolvers } from "../../vulcan-core/default_resolvers";

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
