import schema from './schema';
import { createCollection } from '../../vulcan-lib';
import { addUniversalFields, getDefaultResolvers } from '../../collectionUtils'
import { getDefaultMutations } from '../../vulcan-core/default_mutations';
import { forumTypeSetting } from '../../instanceSettings';

export const ModeratorActions: ModeratorActionsCollection = createCollection({
  collectionName: 'ModeratorActions',
  typeName: 'ModeratorAction',
  collectionType: forumTypeSetting.get() === "EAForum" ? "pg" : "mongo",
  schema,
  resolvers: getDefaultResolvers('ModeratorActions'),
  mutations: getDefaultMutations('ModeratorActions'),
  logChanges: true,
});

addUniversalFields({collection: ModeratorActions});

export default ModeratorActions;
