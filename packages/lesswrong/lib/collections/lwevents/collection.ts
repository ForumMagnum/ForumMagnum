import schema from './schema';
import { userOwns, userCanDo } from '../../vulcan-users/permissions';
import { createCollection } from '../../vulcan-lib';
import { addUniversalFields, getDefaultResolvers, getDefaultMutations } from '../../collectionUtils'

const options = {
  newCheck: (user: DbUser|null, document: DbLWEvent|null) => {
    if (!user || !document) return false;
    return userOwns(user, document) ? userCanDo(user, 'events.new.own') : userCanDo(user, `events.new.all`)
  },

  editCheck: (user: DbUser|null, document: DbLWEvent|null) => {
    if (!user || !document) return false;
    return userCanDo(user, `events.edit.all`)
  },

  removeCheck: (user: DbUser|null, document: DbLWEvent|null) => {
    if (!user || !document) return false;
    return userCanDo(user, `events.remove.all`)
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
