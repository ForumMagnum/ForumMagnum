import schema from './schema';
import { userCanDo } from '../../vulcan-users/permissions';
import { createCollection } from '../../vulcan-lib';
import { addUniversalFields, getDefaultResolvers } from '../../collectionUtils'
import { getDefaultMutations, MutationOptions } from '../../vulcan-core/default_mutations';

const options: MutationOptions<DbBan> = {
  newCheck: (user: DbUser|null, document: DbBan|null) => {
    if (!user || !document) return false;
    return userCanDo(user, 'bans.new');
  },

  editCheck: (user: DbUser|null, document: DbBan|null) => {
    if (!user || !document) return false;
    return userCanDo(user, `bans.edit.all`)
  },

  removeCheck: (user: DbUser|null, document: DbBan|null) => {
    if (!user || !document) return false;
    return userCanDo(user, `bans.remove.all`)
  },
}

export const Bans: BansCollection = createCollection({
  collectionName: 'Bans',
  typeName: 'Ban',
  schema,
  resolvers: getDefaultResolvers('Bans'),
  mutations: getDefaultMutations('Bans', options),
  logChanges: true,
});

addUniversalFields({collection: Bans})

export default Bans
