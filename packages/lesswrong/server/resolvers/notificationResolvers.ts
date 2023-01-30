import { defineQuery } from '../utils/serverGraphqlUtil';
import { Notifications } from '../../lib/collections/notifications/collection';
import { getDefaultViewSelector } from '../../lib/utils/viewUtils';

defineQuery({
  name: "unreadNotificationCounts",
  schema: `
    type NotificationCounts {
      unreadNotifications: Int!
      unreadPrivateMessages: Int!
    }
  `,
  resultType: "NotificationCounts!",
  fn: async (root: void, args: {}, context: ResolverContext): Promise<{
    unreadNotifications: number
    unreadPrivateMessages: number
  }> => {
    const { currentUser } = context;
    if (!currentUser) {
      return {
        unreadNotifications: 0,
        unreadPrivateMessages: 0,
      }
    }
    
    const lastNotificationsCheck = currentUser.lastNotificationsCheck;
    const [unreadNotifications, unreadPrivateMessages] = await Promise.all([
      Notifications.find({
        ...getDefaultViewSelector("Notifications"),
        userId: currentUser._id,
        ...(lastNotificationsCheck && {
          createdAt: {$gt: lastNotificationsCheck},
        }),
      }).count(),
      Notifications.find({
        ...getDefaultViewSelector("Notifications"),
        userId: currentUser._id,
        type: "newMessage",
        ...(lastNotificationsCheck && {
          createdAt: {$gt: lastNotificationsCheck},
        }),
      }).count()
    ]);
    return {
      unreadNotifications,
      unreadPrivateMessages,
    }
  }
});
