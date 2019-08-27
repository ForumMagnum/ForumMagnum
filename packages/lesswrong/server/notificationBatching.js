import moment from 'moment-timezone';
import { Notifications } from '../lib/collections/notifications/collection.js';
import { getNotificationTypes, getNotificationTypeByName } from '../lib/notificationTypes.jsx';
import { EventDebouncer } from './debouncer.js';
import toDictionary from '../lib/modules/utils/toDictionary.js';

// string (notification type name) => Debouncer
export const notificationDebouncers = toDictionary(getNotificationTypes(),
  notificationTypeName => notificationTypeName,
  notificationTypeName => {
    return new EventDebouncer({
      name: `notification_${notificationTypeName}`,
      delayMinutes: 15,
      callback: ({ userId, notificationType }, notificationIds) => {
        sendNotificationBatch({userId, notificationType, notificationIds});
      }
    });
  }
);

const sendNotificationBatch = ({ userId, notificationType, notificationIds }) => {
  Notifications.update(
    { _id: {$in: notificationIds} },
    { $set: { waitingForBatch: false } },
    { multi: true }
  );
  
  console.log(`Sending notification batch with ${notificationIds.length} notifications: ${notificationIds.join(", ")}`);
  // TODO: Send as emails
}
