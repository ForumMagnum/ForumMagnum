import schema from './schema.js';
import { createCollection, getDefaultResolvers, getDefaultMutations } from 'meteor/vulcan:core';
import Users from 'meteor/vulcan:users';
import { addUniversalFields } from '../../collectionUtils'

const options = {
  newCheck: (user, document) => {
    if (!user || !document) return false;
    return Users.owns(user, document) ? Users.canDo(user, 'notifications.new.own') : Users.canDo(user, `notifications.new.all`)
  },

  editCheck: (user, document) => {
    if (!user || !document) return false;
    return Users.owns(user, document) ? Users.canDo(user, 'notifications.edit.own') : Users.canDo(user, `notifications.edit.all`)
  },

  removeCheck: (user, document) => {
    if (!user || !document) return false;
    return Users.owns(user, document) ? Users.canDo(user, 'notifications.remove.own') : Users.canDo(user, `notifications.remove.all`)
  }
}

export const Notifications = createCollection({
  collectionName: 'Notifications',
  typeName: 'Notification',
  schema,
  resolvers: getDefaultResolvers('Notifications'),
  mutations: getDefaultMutations('Notifications', options),
});

addUniversalFields({collection: Notifications})

export default Notifications;