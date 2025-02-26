import schema from './schema';
import { createCollection } from '../../vulcan-lib/collections';
import { getDefaultMutations } from '@/server/resolvers/defaultMutations';
import { addUniversalFields } from "../../collectionUtils";
import { getDefaultResolvers } from "../../vulcan-core/default_resolvers";

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
