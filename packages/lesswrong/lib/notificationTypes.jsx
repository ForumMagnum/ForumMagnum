import React, { Component } from 'react';
import Conversations from './collections/conversations/collection.js';
import { Posts } from './collections/posts';
import { Comments } from './collections/comments'
import Messages from './collections/messages/collection.js';
import Localgroups from './collections/localgroups/collection.js';
import Users from 'meteor/vulcan:users';
import AllIcon from '@material-ui/icons/Notifications';
import PostsIcon from '@material-ui/icons/Description';
import CommentsIcon from '@material-ui/icons/ModeComment';
import MessagesIcon from '@material-ui/icons/Forum';

const notificationTypes = {};
const notificationTypesByUserSetting = {};

export const getNotificationTypes = () => {
  return Object.keys(notificationTypes);
}

export const getNotificationTypeByName = (name) => {
  if (name in notificationTypes)
    return notificationTypes[name];
  else
    throw new Error(`Invalid notification type: ${name}`);
}

export const getNotificationTypeByUserSetting = (settingName) => {
  return notificationTypesByUserSetting[settingName];
}

const registerNotificationType = (notificationTypeClass) => {
  const name = notificationTypeClass.name;
  notificationTypes[name] = notificationTypeClass;
  if (notificationTypeClass.userSettingField)
    notificationTypesByUserSetting[notificationTypeClass.userSettingField] = notificationTypeClass;
  return notificationTypeClass;
}

const getDocument = (documentType, documentId) => {
  if (!documentId) return null;
  
  switch(documentType) {
    case "post":
      return Posts.findOne(documentId);
    case "comment":
      return Comments.findOne(documentId);
    case "user":
      return Users.findOne(documentId);
    case "message":
      return Messages.findOne(documentId);
    default:
      //eslint-disable-next-line no-console
      console.error(`Invalid documentType type: ${documentType}`);
  }
}

const iconStyles = {
  position: "absolute",
  marginTop: '24px',
  marginLeft: '21px'
}

export const NewPostNotification = registerNotificationType({
  name: "newPost",
  userSettingField: "notificationSubscribedUserPost",
  getMessage({documentType, documentId}) {
    let document = getDocument(documentType, documentId);
    return Posts.getAuthorName(document) + ' has created a new post: ' + document.title;
  },
  getIcon() {
    return <PostsIcon style={iconStyles}/>
  },
});

// Vulcan notification that we don't really use
export const PostApprovedNotification = registerNotificationType({
  name: "postApproved",
  userSettingField: null, //TODO
  getMessage({documentType, documentId}) {
    let document = getDocument(documentType, documentId);
    return 'Your post "' + document.title + '" has been approved';
  },
  getIcon() {
    return <AllIcon style={iconStyles} />
  },
});

export const NewEventNotification = registerNotificationType({
  name: "newEvent",
  userSettingField: null, //TODO
  getMessage({documentType, documentId}) {
    let document = getDocument(documentType, documentId);
    let group = {}
    if (documentType == "post" && document.groupId) {
      group = Localgroups.findOne(document.groupId);
    }
    return Posts.getAuthorName(document) + ' has created a new event in the group "' + group.name + '"';
  },
  getIcon() {
    return <AllIcon style={iconStyles} />
  },
});

export const NewGroupPostNotification = registerNotificationType({
  name: "newGroupPost",
  userSettingField: "notificationPostsInGroups",
  getMessage({documentType, documentId}) {
    let document = getDocument(documentType, documentId);
    let group = {}
    if (documentType == "post" && document.groupId) {
      group = Localgroups.findOne(document.groupId);
    }
    return Posts.getAuthorName(document) + ' has created a new post in the group "' + group.name + '"';
  },
  getIcon() {
    return <AllIcon style={iconStyles} />
  },
});

// New comment on a post you're subscribed to.
export const NewCommentNotification = registerNotificationType({
  name: "newComment",
  userSettingField: "notificationCommentsOnSubscribedPost",
  getMessage({documentType, documentId}) {
    let document = getDocument(documentType, documentId);
    return Comments.getAuthorName(document) + ' left a new comment on "' + Posts.findOne(document.postId).title + '"';
  },
  getIcon() {
    return <CommentsIcon style={iconStyles}/>
  },
});

// Reply to a comment you're subscribed to.
export const NewReplyNotification = registerNotificationType({
  name: "newReply",
  userSettingField: "notificationRepliesToSubscribedComments",
  getMessage({documentType, documentId}) {
    let document = getDocument(documentType, documentId);
    return Comments.getAuthorName(document) + ' replied to a comment on "' + Posts.findOne(document.postId).title + '"';
  },
  getIcon() {
    return <CommentsIcon style={iconStyles}/>
  },
});

// Reply to a comment you are the author of.
export const NewReplyToYouNotification = registerNotificationType({
  name: "newReplyToYou",
  userSettingField: "notificationRepliesToMyComments",
  getMessage({documentType, documentId}) {
    let document = getDocument(documentType, documentId);
    return Comments.getAuthorName(document) + ' replied to your comment on "' + Posts.findOne(document.postId).title + '"';
  },
  getIcon() {
    return <CommentsIcon style={iconStyles}/>
  },
});

// Vulcan notification that we don't really use
export const NewUserNotification = registerNotificationType({
  name: "newUser",
  userSettingField: null,
  getMessage({documentType, documentId}) {
    let document = getDocument(documentType, documentId);
    return document.displayName + ' just signed up!';
  },
  getIcon() {
    return <AllIcon style={iconStyles} />
  },
});

export const NewMessageNotification = registerNotificationType({
  name: "newMessage",
  userSettingField: "notificationPrivateMessage",
  mustBeEnabled: true,
  getMessage({documentType, documentId}) {
    let document = getDocument(documentType, documentId);
    let conversation = Conversations.findOne(document.conversationId);
    return Users.findOne(document.userId).displayName + ' sent you a new message' + (conversation.title ? (' in the conversation ' + conversation.title) : "") + '!';
  },
  getIcon() {
    return <MessagesIcon style={iconStyles}/>
  },
});

export const EmailVerificationRequiredNotification = registerNotificationType({
  name: "emailVerificationRequired",
  userSettingField: null,
  getMessage({documentType, documentId}) {
    return "Verify your email address to activate email subscriptions.";
  },
  getIcon() {
    return <AllIcon style={iconStyles} />
  },
});

export const PostSharedWithUserNotification = registerNotificationType({
  name: "postSharedWithUser",
  userSettingField: "notificationSharedWithMe",
  mustBeEnabled: true,
  getMessage({documentType, documentId}) {
    let document = getDocument(documentType, documentId);
    return `You have been shared on the ${document.draft ? "draft" : "post"} ${document.title}`;
  },
  getIcon() {
    return <AllIcon style={iconStyles} />
  },
});


