import schema from './schema';
import Users from '../users/collection'
import { createCollection } from '../../vulcan-lib';
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

export const Bans: BansCollection = createCollection({
  collectionName: 'Bans',
  typeName: 'Ban',
  schema,
  resolvers: getDefaultResolvers('Bans'),
  mutations: getDefaultMutations('Bans', options),
});

addUniversalFields({collection: Bans})

export default Bans
