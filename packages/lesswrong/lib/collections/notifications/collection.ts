import schema from './schema';
import { createCollection } from '../../vulcan-lib';
import { userOwns, userCanDo } from '../../vulcan-users/permissions';
import { addUniversalFields, getDefaultResolvers, getDefaultMutations } from '../../collectionUtils'

const options = {
  newCheck: (user: DbUser|null, document: DbNotification|null) => {
    if (!user || !document) return false;
    return userOwns(user, document) ? userCanDo(user, 'notifications.new.own') : userCanDo(user, `notifications.new.all`)
  },

  editCheck: (user: DbUser|null, document: DbNotification|null) => {
    if (!user || !document) return false;
    return userOwns(user, document) ? userCanDo(user, 'notifications.edit.own') : userCanDo(user, `notifications.edit.all`)
  },

  removeCheck: (user: DbUser|null, document: DbNotification|null) => {
    if (!user || !document) return false;
    return userOwns(user, document) ? userCanDo(user, 'notifications.remove.own') : userCanDo(user, `notifications.remove.all`)
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
