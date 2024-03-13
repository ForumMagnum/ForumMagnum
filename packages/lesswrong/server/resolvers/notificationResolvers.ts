import { defineMutation, defineQuery } from '../utils/serverGraphqlUtil';
import { Notifications } from '../../lib/collections/notifications/collection';
import { getDefaultViewSelector } from '../../lib/utils/viewUtils';
import { getNotificationTypeByName, NotificationDisplay } from '../../lib/notificationTypes';
import { NotificationCountsResult } from '../../lib/collections/notifications/schema';
import { isDialogueParticipant } from "../../components/posts/PostsPage/PostsPage";
import { notifyDialogueParticipantsNewMessage } from "../notificationCallbacks";
import { cheerioParse } from '../utils/htmlUtil';
import { DialogueMessageInfo } from '../../components/posts/PostsPreviewTooltip/PostsPreviewTooltip';
import { handleDialogueHtml } from '../editor/conversionUtils';
import { createPaginatedResolver } from './paginatedResolver';
import { isFriendlyUI } from '../../themes/forumTheme';

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

    const selector = {
      ...getDefaultViewSelector("Notifications"),
      userId: currentUser._id,
    };
    const lastNotificationsCheck = currentUser.lastNotificationsCheck;

    // In bookUI, notifications are considered "read" iif they were created
    // before the current user's `lastNotificationsCheck`. The value of
    // `unreadPrivateMessages` is ignored and not used in the UI.
    // In friendlyUI, the same is true for most notifications, but new message
    // notifications are handled separately - they bypass
    // `lastNotificationsCheck` and instead use the `viewed` field on the
    // notification, so `unreadPrivateMessages` can be displayed independently.
    const [
      unreadPrivateMessages,
      newNotifications,
    ] = await Promise.all([
      isFriendlyUI
        ? Notifications.find({
          ...selector,
          type: "newMessage",
          viewed: {$ne: true},
        }).count()
        : Promise.resolve(0),
      Notifications.find({
        ...selector,
        ...(lastNotificationsCheck && {
          createdAt: {$gt: lastNotificationsCheck},
        }),
        ...(isFriendlyUI && {
          type: {$ne: "newMessage"},
          viewed: {$ne: true},
        }),
      }).fetch(),
    ]);

    const badgeNotifications = newNotifications.filter(notif =>
      !!getNotificationTypeByName(notif.type).causesRedBadge
    );

    return {
      checkedAt,
      unreadNotifications: newNotifications.length,
      unreadPrivateMessages,
      faviconBadgeNumber: badgeNotifications.length,
    }
  }
});

const extractLatestDialogueMessageByUser = async (dialogueHtml: string, userId: string): Promise<DialogueMessageInfo|undefined> => {
  const html = await handleDialogueHtml(dialogueHtml)
  const $ = cheerioParse(html);
  const messages = $('.dialogue-message');
  let latestMessage: DialogueMessageInfo|undefined
  messages.each((_, message) => {
    const messageUserId = $(message).attr('user-id');
    if (messageUserId === userId) {
      latestMessage = {
        dialogueMessageId: $(message).attr('message-id') ?? "",
        dialogueMessageContents: $(message).html() ?? "",
      };
    }
  });
  return latestMessage;
};

defineMutation({
  name: "sendNewDialogueMessageNotification",
  resultType: "Boolean!",
  argTypes: "(postId: String!, dialogueHtml: String!)",
  fn: async (_, {postId, dialogueHtml}: { postId: string, dialogueHtml: string }, {currentUser, loaders}) => {
    if (!currentUser) throw new Error("No user was provided")
    const post = await loaders.Posts.load(postId)
    if (!post) throw new Error("No post was provided")
    if (!post.collabEditorDialogue) throw new Error("Post is not a dialogue")
    if (!isDialogueParticipant(currentUser._id, post)) throw new Error("User is not a dialogue participant")

    const messageInfo = await extractLatestDialogueMessageByUser(dialogueHtml, currentUser._id) 

    await notifyDialogueParticipantsNewMessage(currentUser._id, messageInfo, post)
    
    return true
  }
})

createPaginatedResolver({
  name: "NotificationDisplays",
  graphQLType: "JSON",
  args: {
    type: "String",
  },
  callback: async (
    context: ResolverContext,
    limit: number,
    args?: {type?: string | null},
  ): Promise<NotificationDisplay[]> => {
    const {repos, currentUser} = context;
    if (!currentUser) {
      return [];
    }
    return repos.notifications.getNotificationDisplays({
      userId: currentUser._id,
      type: args?.type ?? undefined,
      limit,
    });
  },
});
