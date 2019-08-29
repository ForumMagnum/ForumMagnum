import { Notifications } from '../lib/collections/notifications/collection.js';
import { getNotificationTypes } from '../lib/notificationTypes.jsx';
import { getNotificationTypeByNameServer } from './notificationTypesServer.jsx';
import { EventDebouncer } from './debouncer.js';
import { wrapAndSendEmail } from './notificationCallbacks.js';
import toDictionary from '../lib/modules/utils/toDictionary.js';
import Users from 'meteor/vulcan:users';

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
      callback: ({ userId, notificationType }, notificationIds) => {
        sendNotificationBatch({userId, notificationType, notificationIds});
      }
    });
  }
);

const sendNotificationBatch = async ({ userId, notificationType, notificationIds }) => {
  const user = Users.getUser(userId);
  Notifications.update(
    { _id: {$in: notificationIds} },
    { $set: { waitingForBatch: false } },
    { multi: true }
  );
  const notifications = await Notifications.find(
    { _id: {$in: notificationIds} }
  ).fetch();
  
  const notificationTypeRenderer = getNotificationTypeByNameServer(notificationType);
  
  if (notificationTypeRenderer.canCombineEmails) {
    await wrapAndSendEmail({
      user,
      subject: await notificationTypeRenderer.emailSubject({ user, notifications }),
      body: await notificationTypeRenderer.emailBody({ user, notifications }),
    });
  } else {
    for (let notification of notifications) {
      await wrapAndSendEmail({
        user,
        subject: await notificationTypeRenderer.emailSubject({ user, notifications:[notification] }),
        body: await notificationTypeRenderer.emailBody({ user, notifications:[notification] }),
      });
    }
  }
}
