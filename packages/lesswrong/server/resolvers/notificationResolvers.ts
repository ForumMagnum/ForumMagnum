import { defineQuery } from '../utils/serverGraphqlUtil';
import { Notifications } from '../../lib/collections/notifications/collection';
import { getDefaultViewSelector } from '../../lib/utils/viewUtils';

defineQuery({
  name: "unreadNotificationsCount",
  resultType: "Int!",
  fn: async (root: void, args: {}, context: ResolverContext): Promise<number> => {
    const { currentUser } = context;
    if (!currentUser)
      return 0;
    
    const lastNotificationsCheck = currentUser.lastNotificationsCheck;
    const notificationsCount = await Notifications.find({
      ...getDefaultViewSelector("Notifications"),
      userId: currentUser._id,
      ...(lastNotificationsCheck && {
        createdAt: {$gt: lastNotificationsCheck},
      }),
    }).count();
    console.log(`notificationsCount=${notificationsCount}`);;
    return notificationsCount;
  }
});
