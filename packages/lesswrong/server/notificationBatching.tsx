import React from 'react';
import { Notifications } from '../lib/collections/notifications/collection';
import { getNotificationTypes } from '../lib/notificationTypes';
import { getNotificationTypeByNameServer } from './notificationTypesServer';
import { EventDebouncer } from './debouncer';
import toDictionary from '../lib/utils/toDictionary';
import { userIsAdmin } from '../lib/vulcan-users/permissions';
import { Posts } from '../lib/collections/posts/collection';
import { Components } from '../lib/vulcan-lib/components';
import { addGraphQLQuery, addGraphQLSchema, addGraphQLResolvers } from '../lib/vulcan-lib/graphql';
import { wrapAndSendEmail, wrapAndRenderEmail } from './emails/renderEmail';
import { getUserEmail } from "../lib/collections/users/helpers";
import Users from '@/lib/collections/users/collection';
import { createAnonymousContext } from './vulcan-lib/query';
import { computeContextFromUser } from './vulcan-lib/apollo-server/context';

// string (notification type name) => Debouncer
export const notificationDebouncers = toDictionary(getNotificationTypes(),
  notificationTypeName => notificationTypeName,
  notificationTypeName => {
    return new EventDebouncer({
      name: `notification_${notificationTypeName}`,
      defaultTiming: {
        type: "delayed",
        delayMinutes: 15,
      },
      callback: ({ userId, notificationType }: {userId: string, notificationType: string}, notificationIds: Array<string>) => {
        void sendNotificationBatch({userId, notificationIds});
      }
    });
  }
);

/**
 * Given a list of notifications (by ID) which had their sending delayed by
 * batching, send them. This could involve sending emails, or adding a
 * notification to the bell icon on-site, or both. In order to make the bell
 * icon notification count trigger, we reset `createdAt` on the notification,
 * so that it counts as newly created and is newer than the last notification
 * check.
 *
 * Precondition: All notifications in a batch share a notification type
 */
const sendNotificationBatch = async ({userId, notificationIds}: {userId: string, notificationIds: Array<string>}) => {
  if (!notificationIds || !notificationIds.length)
    throw new Error("Missing or invalid argument: notificationIds (must be a nonempty array)");
  
  const user = await Users.findOne({_id: userId});
  if (!user) throw new Error(`Missing user: ID ${userId}`);
  const now = new Date();

  await Notifications.rawUpdateMany(
    { _id: {$in: notificationIds} },
    {
      $set: {
        waitingForBatch: false,
        createdAt: now,
      }
    },
    { multi: true }
  );
  const notificationsToEmail = await Notifications.find(
    { _id: {$in: notificationIds}, emailed: true }
  ).fetch();
  
  const context = await computeContextFromUser({ user, isSSR: false });
  if (notificationsToEmail.length) {
    const emails = await notificationBatchToEmails({
      user, notifications: notificationsToEmail,
      context
    });
    
    for (let email of emails) {
      await wrapAndSendEmail(email);
    }
  }
}

const notificationBatchToEmails = async ({user, notifications, context}: {
  user: DbUser,
  notifications: Array<DbNotification>,
  context: ResolverContext,
}) => {
  const notificationType = notifications[0].type;
  const notificationTypeRenderer = getNotificationTypeByNameServer(notificationType);
  
  // Each call to emailSubject or emailBody takes a list of notifications.
  // If we can combine the emails this will be all the notifications in the batch, if we can't combine the emails, this will be a list containing a single notification.
  const groupedNotifications = notificationTypeRenderer.canCombineEmails ? [notifications] : notifications.map((notification) => [notification])

  const shouldSkip = await Promise.all(groupedNotifications.map(async notifications => notificationTypeRenderer.skip({ user, notifications })));
  return await Promise.all(
    groupedNotifications
      .filter((_, idx) => !shouldSkip[idx])
      .map(async (notifications: DbNotification[]) => ({
        user,
        to: getUserEmail(user),
        from: notificationTypeRenderer.from,
        subject: await notificationTypeRenderer.emailSubject({ user, notifications, context }),
        body: await notificationTypeRenderer.emailBody({ user, notifications, context }),
      }))
  );
}


addGraphQLResolvers({
  Query: {
    async EmailPreview(root: void, {notificationIds, postId}: {notificationIds?: Array<string>, postId?: string}, context: ResolverContext) {
      const { currentUser } = context;
      if (!currentUser || !userIsAdmin(currentUser)) {
        throw new Error("This debug feature is only available to admin accounts");
      }
      if (!notificationIds?.length && !postId) {
        return [];
      }
      if (notificationIds?.length && postId) {
        throw new Error("Please only specify notificationIds or postId in the query")
      }
      
      let emails: any[] = []
      if (notificationIds?.length) {
        const notifications = await Notifications.find(
          { _id: {$in: notificationIds} }
        ).fetch();
        emails = await notificationBatchToEmails({
          user: currentUser,
          notifications,
          context
        });
      }
      if (postId) {
        const post = await Posts.findOne(postId)
        if (post) {
          emails = [{
            user: currentUser,
            subject: post.title,
            body: <Components.NewPostEmail documentId={post._id} reason='you have the "Email me new posts in Curated" option enabled' />
          }]
        }
      }
      const renderedEmails = await Promise.all(emails.map(async email => await wrapAndRenderEmail(email)));
      return renderedEmails;
    }
  }
});
addGraphQLSchema(`
  type EmailPreview {
    to: String
    subject: String
    html: String
    text: String
  }
`);
addGraphQLQuery("EmailPreview(notificationIds: [String], postId: String): [EmailPreview]");
