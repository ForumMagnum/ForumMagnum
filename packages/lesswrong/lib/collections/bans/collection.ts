import schema from './schema';
import { userCanDo } from '../../vulcan-users/permissions';
import { createCollection } from '../../vulcan-lib/collections';
import { getDefaultMutations, MutationOptions } from '../../vulcan-core/default_mutations';
import { addUniversalFields } from "../../collectionUtils";
import { getDefaultResolvers } from "../../vulcan-core/default_resolvers";
import { DatabaseIndexSet } from '@/lib/utils/databaseIndexSet';

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
  getIndexes: () => {
    const indexSet = new DatabaseIndexSet();
    indexSet.addIndex('Bans', { ip: 1 })
    return indexSet;
  },
  resolvers: getDefaultResolvers('Bans'),
  mutations: getDefaultMutations('Bans', options),
  logChanges: true,
});

addUniversalFields({collection: Bans})

Bans.checkAccess = async (user: DbUser|null, document: DbBan, context: ResolverContext|null): Promise<boolean> => {
  if (!user || !document) return false;
  return userCanDo(user, 'bans.view')
};

export default Bans
