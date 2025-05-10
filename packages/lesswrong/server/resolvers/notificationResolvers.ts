import { Notifications } from '../../server/collections/notifications/collection';
import { getDefaultViewSelector } from '../../lib/utils/viewUtils';
import { getNotificationTypeByName, NotificationDisplay } from '../../lib/notificationTypes';
import type { NotificationCountsResult } from '@/components/hooks/useUnreadNotifications';
import { isDialogueParticipant } from '../../lib/collections/posts/helpers';
import { notifyDialogueParticipantsNewMessage } from "../notificationCallbacks";
import { cheerioParse } from '../utils/htmlUtil';
import type { DialogueMessageInfo } from '../../components/posts/PostsPreviewTooltip/PostsPreviewTooltip';
import { handleDialogueHtml } from '../editor/conversionUtils';
import { createPaginatedResolver } from './paginatedResolver';
import { isFriendlyUI } from '../../themes/forumTheme';
import gql from "graphql-tag"

const {Query: NotificationDisplaysQuery, typeDefs: NotificationDisplaysTypeDefs} = createPaginatedResolver({
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

export const notificationResolversGqlTypeDefs = gql`
  type NotificationCounts {
    checkedAt: Date!
    unreadNotifications: Int!
    unreadPrivateMessages: Int!
    faviconBadgeNumber: Int!
  }

  extend type Query {
    unreadNotificationCounts: NotificationCounts!
  }
  extend type Mutation {
    MarkAllNotificationsAsRead: Boolean
    sendNewDialogueMessageNotification(postId: String!, dialogueHtml: String!): Boolean!
  }

  ${NotificationDisplaysTypeDefs}
`

export const notificationResolversGqlMutations = {
  async MarkAllNotificationsAsRead (
    _root: void,
    _args: {},
    {currentUser}: ResolverContext,
  ) {
    if (!currentUser) {
      throw new Error("Unauthorized");
    }
    await Notifications.rawUpdateMany({
      userId: currentUser._id,
      type: { $ne: 'newMessage' },
    }, {
      $set: {
        viewed: true,
      },
    });
    return true;
  },
  async sendNewDialogueMessageNotification (_: void, {postId, dialogueHtml}: { postId: string, dialogueHtml: string }, context: ResolverContext) {
    const { currentUser, loaders } = context;
    if (!currentUser) throw new Error("No user was provided")
    const post = await loaders.Posts.load(postId)
    if (!post) throw new Error("No post was provided")
    if (!post.collabEditorDialogue) throw new Error("Post is not a dialogue")
    if (!isDialogueParticipant(currentUser._id, post)) throw new Error("User is not a dialogue participant")

    const messageInfo = await extractLatestDialogueMessageByUser(dialogueHtml, currentUser._id, context) 

    await notifyDialogueParticipantsNewMessage(currentUser._id, messageInfo, post)
    
    return true
  },
}

export const notificationResolversGqlQueries = {
  async unreadNotificationCounts (root: void, args: {}, context: ResolverContext): Promise<NotificationCountsResult> {
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
  },
  
  ...NotificationDisplaysQuery
}

const extractLatestDialogueMessageByUser = async (dialogueHtml: string, userId: string, context: ResolverContext): Promise<DialogueMessageInfo|undefined> => {
  const html = await handleDialogueHtml(dialogueHtml, context)
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
