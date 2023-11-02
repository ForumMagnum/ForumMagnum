import { defineMutation, defineQuery } from '../utils/serverGraphqlUtil';
import { Notifications } from '../../lib/collections/notifications/collection';
import { getDefaultViewSelector } from '../../lib/utils/viewUtils';
import { getNotificationTypeByName } from '../../lib/notificationTypes';
import { NotificationCountsResult } from '../../lib/collections/notifications/schema';
import { isDialogueParticipant } from "../../components/posts/PostsPage/PostsPage";
import { notifyDialogueParticipantsNewMessage } from "../notificationCallbacks";

defineQuery({
  name: "unreadNotificationCounts",
  schema: `
    type NotificationCounts {
      checkedAt: Date!
      unreadNotifications: Int!
      unreadPrivateMessages: Int!
      faviconBadgeNumber: Int!
    }
  `,
  resultType: "NotificationCounts!",
  fn: async (root: void, args: {}, context: ResolverContext): Promise<NotificationCountsResult> => {
    const checkedAt = new Date();
    const { currentUser } = context;
    if (!currentUser) {
      return {
        checkedAt,
        unreadNotifications: 0,
        unreadPrivateMessages: 0,
        faviconBadgeNumber: 0,
      }
    }
    
    const lastNotificationsCheck = currentUser.lastNotificationsCheck;
    const newNotifications = await Notifications.find({
      ...getDefaultViewSelector("Notifications"),
      userId: currentUser._id,
      ...(lastNotificationsCheck && {
        createdAt: {$gt: lastNotificationsCheck},
      }),
    }).fetch();
    const unreadNotifications = newNotifications.length;
    const unreadPrivateMessages = newNotifications.filter(notif => notif.type === "newMessage").length;
    const badgeNotifications = newNotifications.filter(notif =>
      !!getNotificationTypeByName(notif.type).causesRedBadge
    );
    
    return {
      checkedAt,
      unreadNotifications,
      unreadPrivateMessages,
      faviconBadgeNumber: badgeNotifications.length,
    }
  }
});

defineMutation({
  name: "sendNewDialogueMessageNotification",
  resultType: "Boolean!",
  argTypes: "(postId: String!)",
  fn: async (_, {postId}: { postId: string }, {currentUser, loaders}) => {
    if (!currentUser) throw new Error("No user was provided")
    const post = await loaders.Posts.load(postId)
    if (!post) throw new Error("No post was provided")
    if (!post.collabEditorDialogue) throw new Error("Post is not a dialogue")
    if (!isDialogueParticipant(currentUser._id, post)) throw new Error("User is not a dialogue participant")
  
    await notifyDialogueParticipantsNewMessage(currentUser._id, post)
    
    return true
  }
})
