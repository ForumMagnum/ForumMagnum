import schema from './schema';
import { createCollection } from '../../vulcan-lib';
import Users from '../users/collection';
import { addUniversalFields, getDefaultResolvers, getDefaultMutations } from '../../collectionUtils'

const options = {
  newCheck: (user: DbUser|null, document: DbNotification|null) => {
    if (!user || !document) return false;
    return Users.owns(user, document) ? Users.canDo(user, 'notifications.new.own') : Users.canDo(user, `notifications.new.all`)
  },

  editCheck: (user: DbUser|null, document: DbNotification|null) => {
    if (!user || !document) return false;
    return Users.owns(user, document) ? Users.canDo(user, 'notifications.edit.own') : Users.canDo(user, `notifications.edit.all`)
  },

  removeCheck: (user: DbUser|null, document: DbNotification|null) => {
    if (!user || !document) return false;
    return Users.owns(user, document) ? Users.canDo(user, 'notifications.remove.own') : Users.canDo(user, `notifications.remove.all`)
  }
}

export const Notifications: NotificationsCollection = createCollection({
  collectionName: 'Notifications',
  typeName: 'Notification',
  schema,
  resolvers: getDefaultResolvers('Notifications'),
  mutations: getDefaultMutations('Notifications', options),
});

addUniversalFields({collection: Notifications})

export default Notifications;
