import React from 'react';
import Conversations from './collections/conversations/collection';
import { Posts } from './collections/posts';
import { Comments } from './collections/comments';
import { TagRels } from './collections/tagRels/collection';
import { Tags } from './collections/tags/collection';
import Messages from './collections/messages/collection';
import Localgroups from './collections/localgroups/collection';
import Users from './collections/users/collection';
import AllIcon from '@material-ui/icons/Notifications';
import PostsIcon from '@material-ui/icons/Description';
import CommentsIcon from '@material-ui/icons/ModeComment';
import EventIcon from '@material-ui/icons/Event';
import MailIcon from '@material-ui/icons/Mail';

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
    case "tagRel":
      return TagRels.findOne(documentId);
    default:
      //eslint-disable-next-line no-console
      console.error(`Invalid documentType type: ${documentType}`);
  }
}

const iconStyles = {
  margin: 16,
  fontSize: 20,
}

export const NewPostNotification = registerNotificationType({
  name: "newPost",
  userSettingField: "notificationSubscribedUserPost",
  getMessage({documentType, documentId}) {
    let document: DbPost = getDocument(documentType, documentId) as DbPost;
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
    let document: DbPost = getDocument(documentType, documentId) as DbPost;
    return 'Your post "' + document.title + '" has been approved';
  },
  getIcon() {
    return <AllIcon style={iconStyles} />
  },
});

export const NewEventNotification = registerNotificationType({
  name: "newEvent",
  userSettingField: "notificationPostsInGroups",
  getMessage({documentType, documentId}) {
    let document = getDocument(documentType, documentId);
    let group: DbLocalgroup|null = null
    if (documentType == "post") {
      const post = document as DbPost
      if (post.groupId) {
        group = Localgroups.findOne(post.groupId);
      }
    }
    if (group)
      return Posts.getAuthorName(document as DbPost) + ' has created a new event in the group "' + group.name + '"';
    else
      return Posts.getAuthorName(document as DbPost) + ' has created a new event';
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
    let group: DbLocalgroup|null = null
    if (documentType == "post") {
      const post = document as DbPost
      if (post.groupId) {
        group = Localgroups.findOne(post.groupId);
      }
    }
    if (group)
      return Posts.getAuthorName(document as DbPost) + ' has created a new post in the group "' + group.name + '"';
    else
      return Posts.getAuthorName(document as DbPost) + ' has created a new post in a group';
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
    let document = getDocument(documentType, documentId) as DbComment;
    return Comments.getAuthorName(document) + ' left a new comment on "' + Posts.findOne(document.postId)?.title + '"';
  },
  getIcon() {
    return <CommentsIcon style={iconStyles}/>
  },
});

export const NewShortformNotification = registerNotificationType({
  name: "newShortform",
  userSettingField: "notificationShortformContent",
  getMessage({documentType, documentId}) {
    let document = getDocument(documentType, documentId) as DbComment;
    return 'New comment on "' + Posts.findOne(document.postId)?.title + '"';
  },
  getIcon() {
    return <CommentsIcon style={iconStyles}/>
  },
});

export const taggedPostMessage = ({documentType, documentId}) => {
  const tagRel = getDocument(documentType, documentId) as DbTagRel;
  const tag = Tags.findOne({_id: tagRel.tagId})
  const post = Posts.findOne({_id: tagRel.postId})
  return `New post tagged '${tag?.name}: ${post?.title}'`
}

export const NewTagPostsNotification = registerNotificationType({
  name: "newTagPosts",
  userSettingField: "notificationSubscribedTagPost",
  getMessage({documentType, documentId}) {
    return taggedPostMessage({documentType, documentId})
  },
  getIcon() {
    return <PostsIcon style={iconStyles}/>
  },
});

// Reply to a comment you're subscribed to.
export const NewReplyNotification = registerNotificationType({
  name: "newReply",
  userSettingField: "notificationRepliesToSubscribedComments",
  getMessage({documentType, documentId}) {
    let document = getDocument(documentType, documentId) as DbComment;
    let parentTitle = document.postId ? Posts.findOne(document.postId)?.title : Tags.findOne(document.tagId)?.name
    return Comments.getAuthorName(document) + ' replied to a comment on "' + parentTitle + '"';
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
    let document = getDocument(documentType, documentId) as DbComment;
    let parentTitle = document.postId ? Posts.findOne(document.postId)?.title : Tags.findOne(document.tagId)?.name
    return Comments.getAuthorName(document) + ' replied to your comment on "' + parentTitle + '"';
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
    let document = getDocument(documentType, documentId) as DbUser;
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
    let document = getDocument(documentType, documentId) as DbMessage;
    let conversation = Conversations.findOne(document.conversationId);
    return Users.findOne(document.userId)?.displayName + ' sent you a new message' + (conversation?.title ? (' in the conversation ' + conversation.title) : "") + '!';
  },
  getIcon() {
    return <MailIcon style={iconStyles}/>
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
    let document = getDocument(documentType, documentId) as DbPost;
    return `You have been shared on the ${document.draft ? "draft" : "post"} ${document.title}`;
  },
  getIcon() {
    return <AllIcon style={iconStyles} />
  },
});

export const NewEventInNotificationRadiusNotification = registerNotificationType({
  name: "newEventInRadius",
  userSettingField: "notificationEventInRadius",
  getMessage({documentType, documentId}) {
    let document = getDocument(documentType, documentId) as DbPost
    return `A new event has been created within your notification radius: ${document.title}`
  },
  getIcon() {
    return <EventIcon style={iconStyles} />
  }
})

export const EditedEventInNotificationRadiusNotification = registerNotificationType({
  name: "editedEventInRadius",
  userSettingField: "notificationEventInRadius",
  getMessage({documentType, documentId}) {
    let document = getDocument(documentType, documentId) as DbPost
    return `The event ${document.title} changed locations`
  },
  getIcon() {
    return <EventIcon style={iconStyles} />
  }
})
