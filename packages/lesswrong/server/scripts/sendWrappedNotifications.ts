import { createNotification } from "../notificationCallbacksHelpers";
import { Globals } from "../vulcan-lib";

const sendWrappedNotifications = () => {
  createNotification({userId: 'mdqXBbirx9nujMugQ', notificationType: 'wrapped', documentId: null, documentType: null})
}

Globals.sendWrappedNotifications = sendWrappedNotifications;
