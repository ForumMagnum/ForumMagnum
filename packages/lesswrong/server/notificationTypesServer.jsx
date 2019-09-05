import React from 'react';
import { Components } from 'meteor/vulcan:core';
import { Posts } from '../lib/collections/posts/collection.js';
import './emailComponents/EmailComment.jsx';

const notificationTypes = {};

export const getNotificationTypeByNameServer = (name) => {
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

export const NewPostNotification = serverRegisterNotificationType({
  name: "newPost",
  canCombineEmails: false,
  emailSubject: async ({ user, notifications }) => {
    const postId = notifications[0].documentId;
    const post = await Posts.findOne({_id: postId});
    return post.title;
  },
  emailBody: ({ user, notifications }) => {
    const postId = notifications[0].documentId;
    return <Components.NewPostEmail documentId={postId}/>
  },
});

// Vulcan notification that we don't really use
export const PostApprovedNotification = serverRegisterNotificationType({
  name: "postApproved",
  emailSubject: ({ user, notifications }) => {
    return "LessWrong notification";
  },
  emailBody: ({ user, notifications }) => {
  },
});

export const NewEventNotification = serverRegisterNotificationType({
  name: "newEvent",
  emailSubject: ({ user, notifications }) => {
    return "LessWrong notification"; // TODO
  },
  emailBody: ({ user, notifications }) => {
    // TODO
  },
});

export const NewGroupPostNotification = serverRegisterNotificationType({
  name: "newGroupPost",
  emailSubject: ({ user, notifications }) => {
    return "LessWrong notification"; // TODO
  },
  emailBody: ({ user, notifications }) => {
    // TODO
  },
});

export const NewCommentNotification = serverRegisterNotificationType({
  name: "newComment",
  canCombineEmails: true,
  emailSubject: ({ user, notifications }) => {
    return `${notifications.length} comments on posts you subscribed to`;
  },
  emailBody: ({ user, notifications }) => {
    const { EmailComment } = Components;
    return <div>
      {notifications.map(notification =>
        <EmailComment key={notification._id} commentId={notification.documentId}/>)}
    </div>;
  },
});

export const NewReplyNotification = serverRegisterNotificationType({
  name: "newReply",
  canCombineEmails: true,
  emailSubject: ({ user, notifications }) => {
    return `${notifications.length} replies to you`;
  },
  emailBody: ({ user, notifications }) => {
    const { EmailComment } = Components;
    return <div>
      {notifications.map(notification =>
        <EmailComment key={notification._id} commentId={notification.documentId}/>)}
    </div>;
  },
});

export const NewReplyToYouNotification = serverRegisterNotificationType({
  name: "newReplyToYou",
  canCombineEmails: true,
  emailSubject: ({ user, notifications }) => {
    return `${notifications.length} replies to your comments`;
  },
  emailBody: ({ user, notifications }) => {
    const { EmailComment } = Components;
    return <div>
      {notifications.map(notification =>
        <EmailComment key={notification._id} commentId={notification.documentId}/>)}
    </div>;
  },
});

// Vulcan notification that we don't really use
export const NewUserNotification = serverRegisterNotificationType({
  name: "newUser",
  emailSubject: ({ user, notifications }) => {
    return "LessWrong notification";
  },
  emailBody: ({ user, notifications }) => {
  },
});

export const NewMessageNotification = serverRegisterNotificationType({
  name: "newMessage",
  emailSubject: ({ user, notifications }) => {
    return "LessWrong notification"; // TODO
  },
  emailBody: ({ user, notifications }) => {
    // TODO
  },
});

// This notification type should never be emailed (but is displayed in the
// on-site UI).
export const EmailVerificationRequiredNotification = serverRegisterNotificationType({
  name: "emailVerificationRequired",
  emailSubject: ({ user, notifications }) => {
    throw new Error("emailVerificationRequired notification should never be emailed");
  },
  emailBody: ({ user, notifications }) => {
    throw new Error("emailVerificationRequired notification should never be emailed");
  },
});

export const PostSharedWithUserNotification = serverRegisterNotificationType({
  name: "postSharedWithUser",
  canCombineEmails: false,
  emailSubject: ({ user, notifications }) => {
    let document = getDocument(documentType, documentId);
    return `You have been shared on the ${document.draft ? "draft" : "post"} ${document.title}`;
  },
  emailBody: ({ user, notifications }) => {
    let document = getDocument(documentType, documentId);
    // TODO: Proper template, link etc
    return `You have been shared on the ${document.draft ? "draft" : "post"} ${document.title}`;
  },
});
