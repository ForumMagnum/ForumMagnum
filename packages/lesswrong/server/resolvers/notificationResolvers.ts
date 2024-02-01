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

    const lastNotificationsCheck = currentUser.lastNotificationsCheck;
    const newNotifications = await Notifications.find({
      ...getDefaultViewSelector("Notifications"),
      userId: currentUser._id,
      ...(lastNotificationsCheck && {
        createdAt: {$gt: lastNotificationsCheck},
      }),
    }).fetch();

    // Notifications are shown separately from new messages in friendly UI.
    // The `viewed` parameter is currently only actually used for messages,
    // but we check it here for all notifications as it's quite likely we'll
    // expand this in the future.
    const unreadNotifications = isFriendlyUI
      ? newNotifications.filter(
        ({type, viewed}) => type !== "newMessage" && !viewed,
      ).length
      : newNotifications.length;
    const unreadPrivateMessages = newNotifications.filter(
      ({type, viewed}) => type === "newMessage" && !viewed,
    ).length;
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
