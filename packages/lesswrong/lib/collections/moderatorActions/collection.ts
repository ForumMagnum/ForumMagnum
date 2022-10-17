import schema from './schema';
import { createCollection } from '../../vulcan-lib';
import { addUniversalFields, getDefaultResolvers } from '../../collectionUtils'
import { getDefaultMutations } from '../../vulcan-core/default_mutations';

export const ModeratorActions: ModeratorActionsCollection = createCollection({
  collectionName: 'ModeratorActions',
  typeName: 'ModeratorAction',
  schema,
  resolvers: getDefaultResolvers('ModeratorActions'),
  mutations: getDefaultMutations('ModeratorActions'),
  logChanges: true,
});

addUniversalFields({collection: ModeratorActions});

export default ModeratorActions;
