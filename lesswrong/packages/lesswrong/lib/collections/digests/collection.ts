import schema from './schema';
import { createCollection } from '../../vulcan-lib';
import { addUniversalFields, getDefaultResolvers } from '../../collectionUtils'
import { getDefaultMutations } from '../../vulcan-core/default_mutations';

export const Digests: DigestsCollection = createCollection({
  collectionName: 'Digests',
  typeName: 'Digest',
  schema,
  resolvers: getDefaultResolvers('Digests'),
  mutations: getDefaultMutations('Digests'),
  logChanges: true,
});

addUniversalFields({collection: Digests})

export default Digests;
