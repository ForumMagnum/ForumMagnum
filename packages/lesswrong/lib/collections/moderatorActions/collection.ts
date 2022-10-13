import schema from './schema';
import { userCanDo } from '../../vulcan-users/permissions';
import { createCollection } from '../../vulcan-lib';
import { addUniversalFields, getDefaultResolvers } from '../../collectionUtils'
import { getDefaultMutations, MutationOptions } from '../../vulcan-core/default_mutations';

const options: MutationOptions<DbModeratorAction> = {
  newCheck: (user: DbUser|null, document: DbModeratorAction|null) => {
    if (!user || !document) return false;
    return userCanDo(user, 'bans.new');
  },

  editCheck: (user: DbUser|null, document: DbModeratorAction|null) => {
    if (!user || !document) return false;
    return userCanDo(user, `bans.edit.all`)
  },

  removeCheck: (user: DbUser|null, document: DbModeratorAction|null) => {
    if (!user || !document) return false;
    return userCanDo(user, `bans.remove.all`)
  },
}

export const ModeratorActions: ModeratorActionsCollection = createCollection({
  collectionName: 'ModeratorActions',
  typeName: 'ModeratorAction',
  schema,
  resolvers: getDefaultResolvers('ModeratorActions'),
  mutations: getDefaultMutations('ModeratorActions', options),
  logChanges: true,
});

addUniversalFields({collection: ModeratorActions});

export default ModeratorActions;
