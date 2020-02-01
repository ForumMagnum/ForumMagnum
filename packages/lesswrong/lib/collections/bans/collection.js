import schema from './schema';
import Users from 'meteor/vulcan:users'
import { createCollection } from 'meteor/vulcan:core';
import { addUniversalFields, getDefaultResolvers, getDefaultMutations, } from '../../collectionUtils'

const options = {
  newCheck: (user, document) => {
    if (!user || !document) return false;
    return Users.canDo(user, 'bans.new');
  },

  editCheck: (user, document) => {
    if (!user || !document) return false;
    return Users.canDo(user, `bans.edit.all`)
  },

  removeCheck: (user, document) => {
    if (!user || !document) return false;
    return Users.canDo(user, `bans.remove.all`)
  },
}

export const Bans = createCollection({
  collectionName: 'Bans',
  typeName: 'Ban',
  schema,
  resolvers: getDefaultResolvers('Bans'),
  mutations: getDefaultMutations('Bans', options),
});

addUniversalFields({collection: Bans})

export default Bans
