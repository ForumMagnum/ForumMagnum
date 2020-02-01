import schema from './schema';
import Users from 'meteor/vulcan:users'
import { createCollection } from 'meteor/vulcan:core';
import { addUniversalFields, getDefaultResolvers, getDefaultMutations } from '../../collectionUtils'

const options = {
  newCheck: (user, document) => {
    if (!user || !document) return false;
    return Users.owns(user, document) ? Users.canDo(user, 'events.new.own') : Users.canDo(user, `events.new.all`)
  },

  editCheck: (user, document) => {
    if (!user || !document) return false;
    return Users.canDo(user, `events.edit.all`)
  },

  removeCheck: (user, document) => {
    if (!user || !document) return false;
    return Users.canDo(user, `events.remove.all`)
  },
}


export const LWEvents = createCollection({
  collectionName: 'LWEvents',
  typeName: 'LWEvent',
  schema,
  resolvers: getDefaultResolvers('LWEvents'),
  mutations: getDefaultMutations('LWEvents', options),
});

addUniversalFields({collection: LWEvents})

export default LWEvents;
