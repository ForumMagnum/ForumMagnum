import { userCanDo } from '@/lib/vulcan-users/permissions';
import schema from '@/lib/collections/localgroups/schema';
import { createCollection } from '@/lib/vulcan-lib/collections';
import { getDefaultMutations, type MutationOptions } from '@/server/resolvers/defaultMutations';
import { getDefaultResolvers } from "@/server/resolvers/defaultResolvers";
import { DatabaseIndexSet } from '@/lib/utils/databaseIndexSet';

const options: MutationOptions<DbLocalgroup> = {
  newCheck: (user: DbUser|null, document: DbLocalgroup|null) => {
    if (!user || !document) return false;
    return document.organizerIds.includes(user._id) ? userCanDo(user, 'localgroups.new.own')
     : userCanDo(user, `localgroups.new.all`)
  },

  editCheck: (user: DbUser|null, document: DbLocalgroup|null) => {
    if (!user || !document) return false;
    return document.organizerIds.includes(user._id) ? userCanDo(user, 'localgroups.edit.own')
    : userCanDo(user, `localgroups.edit.all`)
  },

  removeCheck: (user: DbUser|null, document: DbLocalgroup|null) => {
    if (!user || !document) return false;
    return document.organizerIds.includes(user._id) ? userCanDo(user, 'localgroups.remove.own')
    : userCanDo(user, `localgroups.remove.all`)
  },
}

export const Localgroups: LocalgroupsCollection = createCollection({
  collectionName: 'Localgroups',
  typeName: 'Localgroup',
  schema,
  getIndexes: () => {
    const indexSet = new DatabaseIndexSet();
    indexSet.addIndex('Localgroups', { organizerIds: 1, deleted: 1, name: 1 });
    indexSet.addIndex('Localgroups', { organizerIds: 1, inactive: 1, deleted: 1, name: 1 });
    indexSet.addIndex('Localgroups', { organizerIds: 1, inactive: 1, deleted: 1 });
    indexSet.addIndex('Localgroups', { inactive: 1, deleted: 1, name: 1 });
    indexSet.addIndex('Localgroups', { mongoLocation: "2dsphere", isOnline: 1, inactive: 1, deleted: 1 });
    indexSet.addIndex('Localgroups', { isOnline: 1, inactive: 1, deleted: 1, name: 1 });
    return indexSet;
  },
  resolvers: getDefaultResolvers('Localgroups'),
  mutations: getDefaultMutations('Localgroups', options),
  logChanges: true,
});


export default Localgroups;
