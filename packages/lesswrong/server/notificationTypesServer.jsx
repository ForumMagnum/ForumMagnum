import React from 'react';
import { Components } from 'meteor/vulcan:core';

const notificationTypes = {};

const getNotificationTypeByNameServer = (name) => {
  if (name in notificationTypes)
    return notificationTypes[name];
  else
    throw new Error(`Invalid notification type: ${name}`);
}

const serverRegisterNotificationType = (notificationTypeClass) => {
  const name = notificationTypeClass.name;
  notificationTypes[name] = notificationTypeClass;
  return notificationTypeClass;
}

export const NewPostNotification = serverExtendNotificationType({
  name: "newPost",
  renderEmail({ notifications }) {
    const { documentId } = notification;
    return <Components.NewPostEmail documentId={documentId}/>
  }
});

export const NewPendingPostNotification = serverExtendNotificationType({
  name: "newPendingPost",
  renderEmail({ notifications }) {
    const { documentId } = notification;
    // TODO
  }
});

export const PostApprovedNotification = serverExtendNotificationType({
  name: "postApproved",
  renderEmail({ notifications }) {
    const { documentId } = notification;
    // TODO
  }
});

export const NewEventNotification = serverExtendNotificationType({
  name: "newEvent",
  renderEmail({ notifications }) {
    const { documentId } = notification;
    // TODO
  }
});

export const NewGroupPostNotification = serverExtendNotificationType({
  name: "newGroupPost",
  renderEmail({ notifications }) {
    const { documentId } = notification;
    // TODO
  }
});

export const NewCommentNotification = serverExtendNotificationType({
  name: "newComment",
  renderEmail({ notifications }) {
    const { documentId } = notification;
    // TODO
  }
});

export const NewReplyNotification = serverExtendNotificationType({
  name: "newReply",
  renderEmail({ notifications }) {
    const { documentId } = notification;
    // TODO
  }
});

export const NewReplyToYouNotification = serverExtendNotificationType({
  name: "newReplyToYou",
  renderEmail({ notifications }) {
    const { documentId } = notification;
    // TODO
  }
});

export const NewUserNotification = serverExtendNotificationType({
  name: "newUser",
  renderEmail({ notifications }) {
    const { documentId } = notification;
    // TODO
  }
});

export const NewMessageNotification = serverExtendNotificationType({
  name: "newMessage",
  renderEmail({ notifications }) {
    const { documentId } = notification;
    // TODO
  }
});

export const EmailVerificationRequiredNotification = serverExtendNotificationType({
  name: "emailVerificationRequired",
  renderEmail({ notifications }) {
    const { documentId } = notification;
    // TODO
  }
});
