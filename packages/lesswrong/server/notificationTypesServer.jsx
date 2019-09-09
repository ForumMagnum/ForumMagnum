import React from 'react';
import { Components } from 'meteor/vulcan:core';
import { Posts } from '../lib/collections/posts/collection.js';
import { Comments } from '../lib/collections/comments/collection.js';
import { Localgroups } from '../lib/collections/localgroups/collection.js';
import Users from 'meteor/vulcan:users';
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
  canCombineEmails: false,
  emailSubject: ({ user, notifications }) => {
    const post = Posts.findOne(notifications[0].documentId);
    return post.title;
  },
  emailBody: ({ user, notifications }) => {
    const postId = notifications[0].documentId;
    return <Components.NewPostEmail documentId={postId}/>
  },
});

export const NewGroupPostNotification = serverRegisterNotificationType({
  name: "newGroupPost",
  canCombineEmails: false,
  emailSubject: ({ user, notifications }) => {
    const post = Posts.findOne(notifications[0].documentId);
    const group = Localgroups.findOne(post?.groupId);
    return `New post in group ${group?.name}`;
  },
  emailBody: ({ user, notifications }) => {
    const postId = notifications[0].documentId;
    return <Components.NewPostEmail documentId={postId}/>
  },
});

export const NewCommentNotification = serverRegisterNotificationType({
  name: "newComment",
  canCombineEmails: true,
  emailSubject: ({ user, notifications }) => {
    if (notifications.length > 1) {
      return `${notifications.length} comments on posts you subscribed to`;
    } else {
      const comment = Comments.findOne(notifications[0].documentId);
      const author = Users.findOne(comment.userId);
      return `${author.displayName} commented on a post you subscribed to`;
    }
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
    if (notifications.length > 1) {
      return `${notifications.length} replies to comments you're subscribed to`;
    } else {
      const comment = Comments.findOne(notifications[0].documentId);
      const author = Users.findOne(comment.userId);
      return `${author.dislpayName} replied to comments you're subscribed to`;
    }
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
  canCombineEmails: false,
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
    let post = Posts.findOne(notifications[0].documentId);
    return `You have been shared on the ${post.draft ? "draft" : "post"} ${post.title}`;
  },
  emailBody: ({ user, notifications }) => {
    let post = Posts.findOne(notifications[0].documentId);
    // TODO: Proper template, link etc
    return `You have been shared on the ${post.draft ? "draft" : "post"} ${post.title}`;
  },
});
