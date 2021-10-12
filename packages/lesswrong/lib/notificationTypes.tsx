import React from 'react';
import Conversations from './collections/conversations/collection';
import { Posts } from './collections/posts';
import { postGetAuthorName } from './collections/posts/helpers';
import { Comments } from './collections/comments/collection';
import { commentGetAuthorName } from './collections/comments/helpers';
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
import { responseToText } from '../components/posts/PostsPage/RSVPForm';
import sortBy from 'lodash/sortBy';

interface NotificationType {
  name: string
  userSettingField: keyof DbUser|null
  mustBeEnabled?: boolean,
  getMessage: (args: {documentType: string|null, documentId: string|null})=>Promise<string>
  getIcon: ()=>React.ReactNode
}

const notificationTypes: Record<string,NotificationType> = {};
const notificationTypesByUserSetting: Partial<Record<keyof DbUser, NotificationType>> = {};

export const getNotificationTypes = () => {
  return Object.keys(notificationTypes);
}

export const getNotificationTypeByName = (name: string) => {
  if (name in notificationTypes)
    return notificationTypes[name];
  else
    throw new Error(`Invalid notification type: ${name}`);
}

export const getNotificationTypeByUserSetting = (settingName: keyof DbUser): NotificationType => {
  const result = notificationTypesByUserSetting[settingName];
  if (!result) throw new Error("Setting does not correspond to a notification type");
  return result;
}

const registerNotificationType = (notificationTypeClass: NotificationType) => {
  const name = notificationTypeClass.name;
  notificationTypes[name] = notificationTypeClass;
  if (notificationTypeClass.userSettingField)
    notificationTypesByUserSetting[notificationTypeClass.userSettingField] = notificationTypeClass;
  return notificationTypeClass;
}

const getDocument = async (documentType: string|null, documentId: string|null) => {
  if (!documentId) return null;
  
  switch(documentType) {
    case "post":
      return await Posts.findOne(documentId);
    case "comment":
      return await Comments.findOne(documentId);
    case "user":
      return await Users.findOne(documentId);
    case "message":
      return await Messages.findOne(documentId);
    case "tagRel":
      return await TagRels.findOne(documentId);
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
  async getMessage({documentType, documentId}: {documentType: string|null, documentId: string|null}) {
    let document: DbPost = await getDocument(documentType, documentId) as DbPost;
    return await postGetAuthorName(document) + ' has created a new post: ' + document.title;
  },
  getIcon() {
    return <PostsIcon style={iconStyles}/>
  },
});

// Vulcan notification that we don't really use
export const PostApprovedNotification = registerNotificationType({
  name: "postApproved",
  userSettingField: null, //TODO
  async getMessage({documentType, documentId}: {documentType: string|null, documentId: string|null}) {
    let document: DbPost = await getDocument(documentType, documentId) as DbPost;
    return 'Your post "' + document.title + '" has been approved';
  },
  getIcon() {
    return <AllIcon style={iconStyles} />
  },
});

export const NewEventNotification = registerNotificationType({
  name: "newEvent",
  userSettingField: "notificationPostsInGroups",
  async getMessage({documentType, documentId}: {documentType: string|null, documentId: string|null}) {
    let document = await getDocument(documentType, documentId);
    let group: DbLocalgroup|null = null
    if (documentType == "post") {
      const post = document as DbPost
      if (post.groupId) {
        group = await Localgroups.findOne(post.groupId);
      }
    }
    if (group)
      return await postGetAuthorName(document as DbPost) + ' has created a new event in the group "' + group.name + '"';
    else
      return await postGetAuthorName(document as DbPost) + ' has created a new event';
  },
  getIcon() {
    return <AllIcon style={iconStyles} />
  },
});

export const NewGroupPostNotification = registerNotificationType({
  name: "newGroupPost",
  userSettingField: "notificationPostsInGroups",
  async getMessage({documentType, documentId}: {documentType: string|null, documentId: string|null}) {
    let document = await getDocument(documentType, documentId);
    let group: DbLocalgroup|null = null
    if (documentType == "post") {
      const post = document as DbPost
      if (post.groupId) {
        group = await Localgroups.findOne(post.groupId);
      }
    }
    if (group)
      return await postGetAuthorName(document as DbPost) + ' has created a new post in the group "' + group.name + '"';
    else
      return await postGetAuthorName(document as DbPost) + ' has created a new post in a group';
  },
  getIcon() {
    return <AllIcon style={iconStyles} />
  },
});

// New comment on a post you're subscribed to.
export const NewCommentNotification = registerNotificationType({
  name: "newComment",
  userSettingField: "notificationCommentsOnSubscribedPost",
  async getMessage({documentType, documentId}: {documentType: string|null, documentId: string|null}) {
    let document = await getDocument(documentType, documentId) as DbComment;
    return await commentGetAuthorName(document) + ' left a new comment on "' + await getCommentParentTitle(document) + '"';
  },
  getIcon() {
    return <CommentsIcon style={iconStyles}/>
  },
});

export const NewShortformNotification = registerNotificationType({
  name: "newShortform",
  userSettingField: "notificationShortformContent",
  async getMessage({documentType, documentId}: {documentType: string|null, documentId: string|null}) {
    let document = await getDocument(documentType, documentId) as DbComment;
    return 'New comment on "' + await getCommentParentTitle(document) + '"';
  },
  getIcon() {
    return <CommentsIcon style={iconStyles}/>
  },
});


export const taggedPostMessage = async ({documentType, documentId}: {documentType: string|null, documentId: string|null}) => {
  const tagRel = await getDocument(documentType, documentId) as DbTagRel;
  const tag = await Tags.findOne({_id: tagRel.tagId})
  const post = await Posts.findOne({_id: tagRel.postId})
  return `New post tagged '${tag?.name}: ${post?.title}'`
}

export const NewTagPostsNotification = registerNotificationType({
  name: "newTagPosts",
  userSettingField: "notificationSubscribedTagPost",
  async getMessage({documentType, documentId}: {documentType: string|null, documentId: string|null}) {
    return await taggedPostMessage({documentType, documentId})
  },
  getIcon() {
    return <PostsIcon style={iconStyles}/>
  },
});

export async function getCommentParentTitle(comment: DbComment) {
  if (comment.postId) return (await Posts.findOne(comment.postId))?.title
  if (comment.tagId) return (await Tags.findOne(comment.tagId))?.name
  return "Unknown Parent"
}

// Reply to a comment you're subscribed to.
export const NewReplyNotification = registerNotificationType({
  name: "newReply",
  userSettingField: "notificationRepliesToSubscribedComments",
  async getMessage({documentType, documentId}: {documentType: string|null, documentId: string|null}) {
    let document = await getDocument(documentType, documentId) as DbComment;
    return await commentGetAuthorName(document) + ' replied to a comment on "' + await getCommentParentTitle(document) + '"';
  },
  getIcon() {
    return <CommentsIcon style={iconStyles}/>
  },
});

// Reply to a comment you are the author of.
export const NewReplyToYouNotification = registerNotificationType({
  name: "newReplyToYou",
  userSettingField: "notificationRepliesToMyComments",
  async getMessage({documentType, documentId}: {documentType: string|null, documentId: string|null}) {
    let document = await getDocument(documentType, documentId) as DbComment;
    return await commentGetAuthorName(document) + ' replied to your comment on "' + await getCommentParentTitle(document) + '"';
  },
  getIcon() {
    return <CommentsIcon style={iconStyles}/>
  },
});

// Vulcan notification that we don't really use
export const NewUserNotification = registerNotificationType({
  name: "newUser",
  userSettingField: null,
  async getMessage({documentType, documentId}: {documentType: string|null, documentId: string|null}) {
    let document = await getDocument(documentType, documentId) as DbUser;
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
  async getMessage({documentType, documentId}: {documentType: string|null, documentId: string|null}) {
    let document = await getDocument(documentType, documentId) as DbMessage;
    let conversation = await Conversations.findOne(document.conversationId);
    return (await Users.findOne(document.userId))?.displayName + ' sent you a new message' + (conversation?.title ? (' in the conversation ' + conversation.title) : "") + '!';
  },
  getIcon() {
    return <MailIcon style={iconStyles}/>
  },
});

// TODO(EA): Fix notificationCallbacks getLink, or the associated component to
// be EA-compatible. Currently we just disable it in the new user callback.
export const EmailVerificationRequiredNotification = registerNotificationType({
  name: "emailVerificationRequired",
  userSettingField: null,
  async getMessage({documentType, documentId}: {documentType: string|null, documentId: string|null}) {
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
  async getMessage({documentType, documentId}: {documentType: string|null, documentId: string|null}) {
    let document = await getDocument(documentType, documentId) as DbPost;
    return `You have been shared on the ${document.draft ? "draft" : "post"} ${document.title}`;
  },
  getIcon() {
    return <AllIcon style={iconStyles} />
  },
});

export const AlignmentSubmissionApprovalNotification = registerNotificationType({
  name: "alignmentSubmissionApproved",
  userSettingField: "notificationAlignmentSubmissionApproved",
  async getMessage({documentType, documentId}: {documentType: string|null, documentId: string|null}) {
    
    if (documentType==='comment') {
      return "Your comment has been accepted to the Alignment Forum";
    } else if (documentType==='post') {
      let post = await getDocument(documentType, documentId) as DbPost
      return `Your post has been accepted to the Alignment Forum: ${post.title}`
    } else throw new Error("documentType must be post or comment!")
  },
  getIcon() {
    return <AllIcon style={iconStyles} />
  },
});

export const NewEventInNotificationRadiusNotification = registerNotificationType({
  name: "newEventInRadius",
  userSettingField: "notificationEventInRadius",
  async getMessage({documentType, documentId}: {documentType: string|null, documentId: string|null}) {
    let document = await getDocument(documentType, documentId) as DbPost
    return `A new event has been created within your notification radius: ${document.title}`
  },
  getIcon() {
    return <EventIcon style={iconStyles} />
  }
})

export const EditedEventInNotificationRadiusNotification = registerNotificationType({
  name: "editedEventInRadius",
  userSettingField: "notificationEventInRadius",
  async getMessage({documentType, documentId}: {documentType: string|null, documentId: string|null}) {
    let document = await getDocument(documentType, documentId) as DbPost
    return `The event ${document.title} changed locations`
  },
  getIcon() {
    return <EventIcon style={iconStyles} />
  }
})


export const NewRSVPNotification = registerNotificationType({
  name: "newRSVP",
  userSettingField: "notificationRSVPs",
  async getMessage({documentType, documentId}: {documentType: string|null, documentId: string|null}) {
    const document = await getDocument(documentType, documentId) as DbPost
    const rsvps = document.rsvps || []
    const lastRSVP = sortBy(rsvps, r => r.createdAt)[rsvps.length - 1]
    return `${lastRSVP.name} ${lastRSVP.email ? `(${lastRSVP.email})` : ""} responded "${responseToText[lastRSVP.response]}" to your event ${document.title}`
  },
  getIcon() {
    return <EventIcon style={iconStyles} />
  }
})

export const YouAreATagRelevanceVoterNotification = registerNotificationType({
  name: "youAreATagRelevanceVoter",
  userSettingField: null,
  async getMessage({documentType, documentId}: {documentType: string|null, documentId: string|null}) {
    return 'Thank you for voting on tag relevance!';
  },
  getIcon() {
    return <AllIcon style={iconStyles} />
  },
});

