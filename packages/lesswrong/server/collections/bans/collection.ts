import schema from '@/lib/collections/bans/schema';
import { userCanDo } from '@/lib/vulcan-users/permissions';
import { createCollection } from '@/lib/vulcan-lib/collections';
import { getDefaultMutations, type MutationOptions } from '@/server/resolvers/defaultMutations';
import { getDefaultResolvers } from "@/lib/vulcan-core/default_resolvers";
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

export default Bans
