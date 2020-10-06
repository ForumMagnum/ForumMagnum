import schema from './schema';
import Users from '../users/collection'
import { createCollection } from '../../vulcan-lib';
import { addUniversalFields, getDefaultResolvers, getDefaultMutations } from '../../collectionUtils'

const options = {
  newCheck: (user: DbUser|null, document: DbLWEvent|null) => {
    if (!user || !document) return false;
    return Users.owns(user, document) ? Users.canDo(user, 'events.new.own') : Users.canDo(user, `events.new.all`)
  },

  editCheck: (user: DbUser|null, document: DbLWEvent|null) => {
    if (!user || !document) return false;
    return Users.canDo(user, `events.edit.all`)
  },

  removeCheck: (user: DbUser|null, document: DbLWEvent|null) => {
    if (!user || !document) return false;
    return Users.canDo(user, `events.remove.all`)
  },
}


export const LWEvents: LWEventsCollection = createCollection({
  collectionName: 'LWEvents',
  typeName: 'LWEvent',
  schema,
  resolvers: getDefaultResolvers('LWEvents'),
  mutations: getDefaultMutations('LWEvents', options),
});

addUniversalFields({collection: LWEvents})

export default LWEvents;
