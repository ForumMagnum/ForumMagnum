import { defineQuery } from '../utils/serverGraphqlUtil';
import { Notifications } from '../../lib/collections/notifications/collection';
import { getDefaultViewSelector } from '../../lib/utils/viewUtils';

defineQuery({
  name: "unreadNotificationCounts",
  schema: `
    type NotificationCounts {
      checkedAt: Date!
      unreadNotifications: Int!
      unreadPrivateMessages: Int!
    }
  `,
  resultType: "NotificationCounts!",
  fn: async (root: void, args: {}, context: ResolverContext): Promise<{
    checkedAt: Date,
    unreadNotifications: number
    unreadPrivateMessages: number
  }> => {
    const checkedAt = new Date();
    const { currentUser } = context;
    if (!currentUser) {
      return {
        checkedAt,
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
      checkedAt,
      unreadNotifications,
      unreadPrivateMessages,
    }
  }
});
