import React from 'react';
import { Components } from './vulcan-lib/components';
import Conversations from './collections/conversations/collection';
import { Posts } from './collections/posts';
import { getPostCollaborateUrl, postGetAuthorName, postGetEditUrl } from './collections/posts/helpers';
import { Comments } from './collections/comments/collection';
import { commentGetAuthorName } from './collections/comments/helpers';
import { TagRels } from './collections/tagRels/collection';
import { Tags } from './collections/tags/collection';
import Messages from './collections/messages/collection';
import Localgroups from './collections/localgroups/collection';
import Users from './collections/users/collection';
import PostsIcon from '@material-ui/icons/Description';
import CommentsIcon from '@material-ui/icons/ModeComment';
import EventIcon from '@material-ui/icons/Event';
import MailIcon from '@material-ui/icons/Mail';
import { responseToText } from '../components/posts/PostsPage/RSVPForm';
import sortBy from 'lodash/sortBy';
import { REVIEW_NAME_IN_SITU } from './reviewUtils';
import SupervisedUserCircleIcon from '@material-ui/icons/SupervisedUserCircle';
import GroupAddIcon from '@material-ui/icons/GroupAdd';
import DoneIcon from '@material-ui/icons/Done';
import { NotificationChannelOption } from './collections/users/schema';
import startCase from 'lodash/startCase';
import { GiftIcon } from '../components/icons/giftIcon';
import { userGetDisplayName } from './collections/users/helpers'
import { TupleSet, UnionOf } from './utils/typeGuardUtils'
import DebateIcon from '@material-ui/icons/Forum';
import DialogueChecks from './collections/dialogueChecks/collection';
import { getUserABTestGroup } from './abTestImpl';
import { checkNotificationMessageContent, staleDialogueMessageContent } from './abTests';

export const notificationDocumentTypes = new TupleSet(['post', 'comment', 'user', 'message', 'tagRel', 'localgroup', 'dialogueCheck'] as const)
export type NotificationDocument = UnionOf<typeof notificationDocumentTypes>

interface GetMessageProps {
  documentType: NotificationDocument | null
  documentId: string | null
  extraData?: Record<string,any>
}

interface GetDialogueMessageProps {
  documentType: NotificationDocument | null
  documentId: string | null
  newMessageAuthorId: string
  newMessageContents: string
}

interface NotificationType {
  name: string
  userSettingField: keyof DbUser|null
  allowedChannels?: NotificationChannelOption[],
  getMessage: (args: {documentType: NotificationDocument|null, documentId: string|null, extraData?: Record<string,any>})=>Promise<string>
  getIcon: ()=>React.ReactNode
  onsiteHoverView?: (props: {notification: NotificationsList})=>React.ReactNode
  getLink?: (props: { documentType: string|null, documentId: string|null, extraData: Record<string,any> })=>string
  causesRedBadge?: boolean
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

const registerNotificationType = ({allowedChannels = ["none", "onsite", "email", "both"], ...otherArgs}: NotificationType) => {
  const notificationTypeClass = {allowedChannels, ...otherArgs};

  const name = notificationTypeClass.name;
  notificationTypes[name] = notificationTypeClass;
  if (notificationTypeClass.userSettingField)
    notificationTypesByUserSetting[notificationTypeClass.userSettingField] = notificationTypeClass;
  return notificationTypeClass;
}

export const getDocument = async (documentType: NotificationDocument | null, documentId: string | null) =>
  (await getDocumentSummary(documentType, documentId))?.document

type DocumentSummary =
  | { type: 'post'; associatedUserName: string; displayName: string; document: DbPost }
  | { type: 'comment'; associatedUserName: string; displayName: string | undefined; document: DbComment }
  | { type: 'user'; associatedUserName: string; displayName: string; document: DbUser }
  | { type: 'message'; associatedUserName: string; displayName: string | undefined; document: DbMessage }
  | { type: 'localgroup'; displayName: string; document: DbLocalgroup; associatedUserName: null }
  | { type: 'tagRel'; document: DbTagRel; associatedUserName: null; displayName: null }
  | { type: 'dialogueCheck'; document: DbDialogueCheck; associatedUserName: string; displayName: null }

export const getDocumentSummary = async (documentType: NotificationDocument | null, documentId: string | null): Promise<DocumentSummary | null> => {
  if (!documentId) return null

  switch (documentType) {
    case 'post':
      const post = await Posts.findOne(documentId)
      return post && {
        type: documentType,
        document: post,
        displayName: post.title,
        associatedUserName: await postGetAuthorName(post),
      }
    case 'comment':
      const comment = await Comments.findOne(documentId)
      return comment && {
        type: documentType,
        document: comment,
        displayName: await getCommentParentTitle(comment),
        associatedUserName: await commentGetAuthorName(comment),
      }
    case 'user':
      const user = await Users.findOne(documentId)
      return user && {
        type: documentType,
        document: user,
        displayName: userGetDisplayName(user),
        associatedUserName: userGetDisplayName(user),
      }
    case 'message':
      const message = await Messages.findOne(documentId)
      if (!message) return null

      const conversation = await Conversations.findOne(message.conversationId)
      const author = await Users.findOne(message.userId)
      return {
        type: documentType,
        document: message,
        displayName: conversation?.title ?? undefined,
        associatedUserName: userGetDisplayName(author),
      }
    case 'localgroup':
      const localgroup = await Localgroups.findOne(documentId)
      return localgroup && {
        type: documentType,
        document: localgroup,
        displayName: localgroup.name ?? "[missing local group name]",
        associatedUserName: null,
      }
    case 'tagRel':
      const tagRel = await TagRels.findOne(documentId)
      return tagRel && {
        type: documentType,
        document: tagRel,
        displayName: null,
        associatedUserName: null,
      }
    case 'dialogueCheck':
      const dialogueCheck = await DialogueChecks.findOne({ _id: documentId })
      const targetUser = await Users.findOne(dialogueCheck?.targetUserId)
      return dialogueCheck && {
        type: documentType,
        document: dialogueCheck,
        associatedUserName: userGetDisplayName(targetUser),
        displayName: null,
      }
    default:
      //eslint-disable-next-line no-console
      console.error(`Invalid documentType type: ${documentType}`)
      return null
  }
}

const iconStyles = {
  margin: 16,
  fontSize: 20,
}
const flatIconStyles = {
  margin: 16,
  height: 20,
  width: 26,
}

export const NewPostNotification = registerNotificationType({
  name: "newPost",
  userSettingField: "notificationSubscribedUserPost",
  async getMessage({documentType, documentId}: GetMessageProps) {
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
  async getMessage({documentType, documentId}: GetMessageProps) {
    let document: DbPost = await getDocument(documentType, documentId) as DbPost;
    return 'Your post "' + document.title + '" has been approved';
  },
  getIcon() {
    return <Components.ForumIcon icon="Bell" style={iconStyles} />
  },
});

export const PostNominatedNotification = registerNotificationType({
  name: "postNominated",
  userSettingField: "notificationPostsNominatedReview",
  async getMessage({documentType, documentId}: GetMessageProps) {
    let post: DbPost = await getDocument(documentType, documentId) as DbPost;
    return `Your post is nominated for the ${REVIEW_NAME_IN_SITU}: "${post.title}"`
  },
  getIcon() {
    return <Components.ForumIcon icon="Star" style={iconStyles} />
  }
})

export const NewEventNotification = registerNotificationType({
  name: "newEvent",
  userSettingField: "notificationPostsInGroups",
  async getMessage({documentType, documentId}: GetMessageProps) {
    let document = await getDocument(documentType, documentId);
    let group: DbLocalgroup|null = null
    if (documentType === "post") {
      const post = document as DbPost
      if (post.groupId) {
        group = await Localgroups.findOne(post.groupId);
      }
    }
    if (group)
      return `${group.name} posted a new event`;
    else
      return await postGetAuthorName(document as DbPost) + ' has created a new event';
  },
  getIcon() {
    return <Components.ForumIcon icon="Bell" style={iconStyles} />
  },
});

export const NewGroupPostNotification = registerNotificationType({
  name: "newGroupPost",
  userSettingField: "notificationPostsInGroups",
  async getMessage({documentType, documentId}: GetMessageProps) {
    let document = await getDocument(documentType, documentId);
    let group: DbLocalgroup|null = null
    if (documentType === "post") {
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
    return <Components.ForumIcon icon="Bell" style={iconStyles} />
  },
});

// New comment on a post you're subscribed to.
export const NewCommentNotification = registerNotificationType({
  name: "newComment",
  userSettingField: "notificationCommentsOnSubscribedPost",
  async getMessage({documentType, documentId}: GetMessageProps) {
    let document = await getDocument(documentType, documentId) as DbComment;
    return await commentGetAuthorName(document) + ' left a new comment on "' + await getCommentParentTitle(document) + '"';
  },
  getIcon() {
    return <CommentsIcon style={iconStyles}/>
  },
});

// New comment on a subforum you're subscribed to.
export const NewSubforumCommentNotification = registerNotificationType({
  name: "newSubforumComment",
  userSettingField: "notificationSubforumUnread",
  allowedChannels: ["none", "onsite", "email", "both"],
  async getMessage({documentType, documentId}: GetMessageProps) {
    // e.g. "Forecasting: Will Howard left a new comment"
    let document = await getDocument(documentType, documentId) as DbComment;
    return await `${startCase(await getCommentParentTitle(document))}: ${await commentGetAuthorName(document)} left a new comment`;
  },
  getIcon() {
    return <CommentsIcon style={iconStyles}/>
  },
});

// New message in a dialogue which you are a participant
// (Notifications for regular comments are handled through the `newComment` notification.)
export const NewDialogueMessagesNotification = registerNotificationType({
  name: "newDialogueMessages",
  userSettingField: "notificationDialogueMessages",
  async getMessage({documentType, documentId, extraData}: GetMessageProps) {

    const newMessageAuthorId = extraData?.newMessageAuthorId
    let post = await getDocument(documentType, documentId) as DbPost;
    let author = await getDocument("user", newMessageAuthorId) as DbUser ?? '[Missing Author Name]';

    return userGetDisplayName(author) + ' left a new reply in your dialogue "' + post.title + '"';
  },
  getIcon() {
    return <DebateIcon style={iconStyles}/>
  },
  getLink: ({documentId}: {
    documentId: string|null,
  }): string => {
    return `/editPost?postId=${documentId}`;
  },
  causesRedBadge: true,
});

// Used when a user already has unread dialogue message notification. Primitive batching to prevent spamming the user.
// Send instead of NewDialogueMessageNotifications when there is already one already unread. Not sent if another instance of itself is unread.
export const NewDialogueMessagesBatchNotification = registerNotificationType({
  name: "newDialogueBatchMessages",
  //using same setting as regular NewDialogueMessageNotification, since really the same
  userSettingField: "notificationDialogueMessages",
  async getMessage({documentType, documentId}: GetMessageProps) {
    const post = await getDocument(documentType, documentId) as DbPost;

    return 'Multiple new messages in your dialogue "' + post.title + '"';
  },
  getIcon() {
    return <DebateIcon style={iconStyles}/>
  },
  getLink: ({documentId}: {
    documentId: string|null,
  }): string => {
    return `/editPost?postId=${documentId}`;
  },
});

// New published dialogue message(s) on a dialogue post you're subscribed to. 
// (Notifications for regular comments are still handled through the `newComment` notification.)
export const NewPublishedDialogueMessagesNotification = registerNotificationType({
  name: "newPublishedDialogueMessages",
  userSettingField: "notificationPublishedDialogueMessages",
  async getMessage({documentType, documentId}: GetMessageProps) {
    let post = await getDocument(documentType, documentId) as DbPost;
    return `New content in the dialogue "${post.title}"`;
  },
  getIcon() {
    return <DebateIcon style={iconStyles}/>
  },
  causesRedBadge: false,
});

// New dialogue match between you and another user
export const NewDialogueMatchNotification = registerNotificationType({
  name: "newDialogueMatch",
  userSettingField: "notificationDialogueMatch",
  async getMessage({documentType, documentId}: GetMessageProps) {
    const summary = await getDocumentSummary(documentType, documentId)
    if (summary && summary?.associatedUserName) {
      return `You matched with ${summary.associatedUserName} for Dialogue Matching!`
    }
    return "You have a new Dialogue Match!"
  },
  getIcon() {
    return <DebateIcon style={iconStyles}/>
  },
  getLink() {
    return "/dialogueMatching"
  }
});

// Notification that you have new interested parties for dialogues
export const NewDialogueCheckNotification = registerNotificationType({
  name: "newDialogueChecks",
  userSettingField: "notificationNewDialogueChecks",
  allowedChannels: ["onsite", "none"],
  async getMessage(props: GetMessageProps) {
    let notificationAbGroup = ""
    const userId = props.extraData?.userId
    if (userId) { 
      const user = await getDocument("user", userId) as DbUser
      notificationAbGroup = getUserABTestGroup({user}, checkNotificationMessageContent)
    }
    switch (notificationAbGroup) {
      case "v1":
        return `New users interested in dialoguing with you (not a match yet)`
      case "v2":
        return `You got new checks in dialogue matching`
      case "v3":
        return `New users want to dialogue with you, since last you checked`
      case "v4":
        return `You got new users who checked you for dialogues`
      default:
        return `New users interested in dialoguing with you (not a match yet)`
    }    
  },
  getIcon() {
    return <DebateIcon style={iconStyles}/>
  },
  getLink() {
    return "/dialogueMatching"
  }
});

export const StaleDialoguePingNotification = registerNotificationType({
  name: "sendDialogueHelperBotPing",
  userSettingField: "notificationDialogueHelperBotPing",
  allowedChannels: ["onsite", "none"],
  async getMessage(props: GetMessageProps) {
    let notificationAbGroup = ""
    const userId = props.extraData?.userId
    if (userId) { 
      const user = await getDocument("user", userId) as DbUser
      notificationAbGroup = getUserABTestGroup({user}, staleDialogueMessageContent)
    }

    const targetUserDisplayName = props.extraData?.targetUserDisplayName
    switch (notificationAbGroup) {
      // Reference length of how much text is displayed: 
     // return `steven byrnes left a new comment on "How do you feel about`
      case "v1":
        return `Click to resume: unpublished Dialogue with ${targetUserDisplayName}`
      case "v2":
        return `Reminder: open Dialogue with ${targetUserDisplayName}. Resume`
      case "v3":
        return `Heads-up, you've a lingering dialogue with ${targetUserDisplayName}`
      case "v4":
        return `In case you forgot: you started a dialogue with ${targetUserDisplayName}`
      default:
        return `Click to resume: unpublished Dialogue with ${targetUserDisplayName}`
    }    
  },
  getIcon() {
    return <DebateIcon style={iconStyles}/>
  },
  getLink(props) {
    return `/posts/${props.extraData.dialogueId}` 
  }
});

//NOTIFICATION FOR OLD DIALOGUE FORMAT
//TO-DO: clean up eventually
// New debate comment on a debate post you're subscribed to.  For readers explicitly subscribed to the debate.
// (Notifications for regular comments are still handled through the `newComment` notification.)
export const NewDebateCommentNotification = registerNotificationType({
  name: "newDebateComment",
  userSettingField: "notificationDebateCommentsOnSubscribedPost",
  async getMessage({documentType, documentId}: GetMessageProps) {
    let document = await getDocument(documentType, documentId) as DbComment;
    return await commentGetAuthorName(document) + ' left a new reply on the dialogue "' + await getCommentParentTitle(document) + '"';
  },
  getIcon() {
    return <CommentsIcon style={iconStyles}/>
  },
});

//NOTIFICATION FOR OLD DIALOGUE FORMAT
//TO-DO: clean up eventually
// New debate comment on a debate post you're subscribed to.  For debate participants implicitly subscribed to the debate.
// (Notifications for regular comments are still handled through the `newComment` notification.)
export const NewDebateReplyNotification = registerNotificationType({
  name: "newDebateReply",
  userSettingField: "notificationDebateReplies",
  async getMessage({documentType, documentId}: GetMessageProps) {
    let document = await getDocument(documentType, documentId) as DbComment;
    return await commentGetAuthorName(document) + ' left a new reply on the dialogue "' + await getCommentParentTitle(document) + '"';
  },
  getIcon() {
    return <DebateIcon style={iconStyles}/>
  },
  causesRedBadge: true,
});

export const NewShortformNotification = registerNotificationType({
  name: "newShortform",
  userSettingField: "notificationShortformContent",
  async getMessage({documentType, documentId}: GetMessageProps) {
    let document = await getDocument(documentType, documentId) as DbComment;
    return 'New comment on "' + await getCommentParentTitle(document) + '"';
  },
  getIcon() {
    return <CommentsIcon style={iconStyles}/>
  },
});


export const taggedPostMessage = async ({documentType, documentId}: GetMessageProps) => {
  const tagRel = await getDocument(documentType, documentId) as DbTagRel;
  const tag = await Tags.findOne({_id: tagRel.tagId})
  const post = await Posts.findOne({_id: tagRel.postId})
  return `New post tagged '${tag?.name}: ${post?.title}'`
}

export const NewTagPostsNotification = registerNotificationType({
  name: "newTagPosts",
  userSettingField: "notificationSubscribedTagPost",
  async getMessage({documentType, documentId}: GetMessageProps) {
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
  async getMessage({documentType, documentId}: GetMessageProps) {
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
  async getMessage({documentType, documentId}: GetMessageProps) {
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
  async getMessage({documentType, documentId}: GetMessageProps) {
    let document = await getDocument(documentType, documentId) as DbUser;
    return document.displayName + ' just signed up!';
  },
  getIcon() {
    return <Components.ForumIcon icon="Bell" style={iconStyles} />
  },
});

export const NewMessageNotification = registerNotificationType({
  name: "newMessage",
  userSettingField: "notificationPrivateMessage",
  allowedChannels: ["onsite", "email", "both"],
  async getMessage({documentType, documentId}: GetMessageProps) {
    let document = await getDocument(documentType, documentId) as DbMessage;
    let conversation = await Conversations.findOne(document.conversationId);
    return (await Users.findOne(document.userId))?.displayName + ' sent you a new message' + (conversation?.title ? (' in the conversation ' + conversation.title) : "") + '!';
  },
  getIcon() {
    return <MailIcon style={iconStyles}/>
  },
  causesRedBadge: true,
});

export const WrappedNotification = registerNotificationType({
  name: "wrapped",
  userSettingField: "notificationPrivateMessage",
  allowedChannels: ["onsite", "email", "both"],
  async getMessage() {
    return "Check out your 2022 EA Forum Wrapped"
  },
  getIcon() {
    return <GiftIcon style={flatIconStyles}/>
  },
  getLink() {
    return "/wrapped"
  }
});

// TODO(EA): Fix notificationCallbacks getLink, or the associated component to
// be EA-compatible. Currently we just disable it in the new user callback.
export const EmailVerificationRequiredNotification = registerNotificationType({
  name: "emailVerificationRequired",
  userSettingField: null,
  async getMessage({documentType, documentId}: GetMessageProps) {
    return "Verify your email address to activate email subscriptions.";
  },
  getIcon() {
    return <Components.ForumIcon icon="Bell" style={iconStyles} />
  },
});

export const PostSharedWithUserNotification = registerNotificationType({
  name: "postSharedWithUser",
  userSettingField: "notificationSharedWithMe",
  allowedChannels: ["onsite", "email", "both"],
  async getMessage({documentType, documentId}: GetMessageProps) {
    let document = await getDocument(documentType, documentId) as DbPost;
    const name = await postGetAuthorName(document);
    return `${name} shared their ${document.draft ? "draft" : "post"} "${document.title}" with you`;
  },
  getIcon() {
    return <Components.ForumIcon icon="Bell" style={iconStyles} />
  },
  getLink: ({documentType, documentId, extraData}: {
    documentType: string|null,
    documentId: string|null,
    extraData: any
  }): string => {
    if (!documentId) {
      throw new Error("PostSharedWithUserNotification documentId is missing")
    }
    return getPostCollaborateUrl(documentId, false)
  }
});

export const PostAddedAsCoauthorNotification = registerNotificationType({
  name: "addedAsCoauthor",
  userSettingField: "notificationAddedAsCoauthor",
  allowedChannels: ["onsite", "email", "both"],
  async getMessage({documentType, documentId}: GetMessageProps) {
    let document = await getDocument(documentType, documentId) as DbPost;
    const name = await postGetAuthorName(document);
    const postOrDialogue = document.collabEditorDialogue ? 'dialogue' : 'post';
    return `${name} added you as a coauthor to the ${postOrDialogue} "${document.title}"`;
  },
  getIcon() {
    return <GroupAddIcon style={iconStyles} />
  },
  getLink: ({documentType, documentId, extraData}: {
    documentType: string|null,
    documentId: string|null,
    extraData: any
  }): string => {
    if (!documentId) {
      throw new Error("PostAddedAsCoauthorNotification documentId is missing")
    }
    return postGetEditUrl(documentId, false)
  }
});

export const AlignmentSubmissionApprovalNotification = registerNotificationType({
  name: "alignmentSubmissionApproved",
  userSettingField: "notificationAlignmentSubmissionApproved",
  async getMessage({documentType, documentId}: GetMessageProps) {
    
    if (documentType==='comment') {
      return "Your comment has been accepted to the Alignment Forum";
    } else if (documentType==='post') {
      let post = await getDocument(documentType, documentId) as DbPost
      return `Your post has been accepted to the Alignment Forum: ${post.title}`
    } else throw new Error("documentType must be post or comment!")
  },
  getIcon() {
    return <Components.ForumIcon icon="Bell" style={iconStyles} />
  },
});

export const NewEventInNotificationRadiusNotification = registerNotificationType({
  name: "newEventInRadius",
  userSettingField: "notificationEventInRadius",
  async getMessage({documentType, documentId}: GetMessageProps) {
    let document = await getDocument(documentType, documentId) as DbPost
    return `New event in your area: ${document.title}`
  },
  getIcon() {
    return <EventIcon style={iconStyles} />
  }
})

export const EditedEventInNotificationRadiusNotification = registerNotificationType({
  name: "editedEventInRadius",
  userSettingField: "notificationEventInRadius",
  async getMessage({documentType, documentId}: GetMessageProps) {
    let document = await getDocument(documentType, documentId) as DbPost
    return `Event in your area updated: ${document.title}`
  },
  getIcon() {
    return <EventIcon style={iconStyles} />
  }
})


export const NewRSVPNotification = registerNotificationType({
  name: "newRSVP",
  userSettingField: "notificationRSVPs",
  async getMessage({documentType, documentId}: GetMessageProps) {
    const document = await getDocument(documentType, documentId) as DbPost
    const rsvps = document.rsvps || []
    const lastRSVP = sortBy(rsvps, r => r.createdAt)[rsvps.length - 1]
    return `${lastRSVP.name} responded "${responseToText[lastRSVP.response]}" to your event ${document.title}`
  },
  getIcon() {
    return <EventIcon style={iconStyles} />
  }
})

export const KarmaPowersGainedNotification = registerNotificationType({
  name: "karmaPowersGained",
  userSettingField: "notificationKarmaPowersGained",
  async getMessage() {
    return "Your votes are stronger because your karma went up!"
  },
  getLink() {
    return `/tag/vote-strength`;
  },
  getIcon() {
    return <Components.ForumIcon icon="Bell" style={iconStyles} />
  }
})
export const CancelledRSVPNotification = registerNotificationType({
  name: "cancelledRSVP",
  userSettingField: "notificationRSVPs",
  async getMessage({documentType, documentId}: GetMessageProps) {
    const document = await getDocument(documentType, documentId) as DbPost
    return `Someone cancelled their RSVP to your event ${document.title}`
  },
  getIcon() {
    return <EventIcon style={iconStyles} />
  }
})

export const NewGroupOrganizerNotification = registerNotificationType({
  name: "newGroupOrganizer",
  userSettingField: "notificationGroupAdministration",
  async getMessage({documentType, documentId}: GetMessageProps) {
    if (documentType !== 'localgroup') throw new Error("documentType must be localgroup")
    const localGroup = await Localgroups.findOne(documentId)
    if (!localGroup) throw new Error("Cannot find local group for which this notification is being sent")
    return `You've been added as an organizer of ${localGroup.name}`
  },
  getIcon() {
    return <SupervisedUserCircleIcon style={iconStyles} />
  }
})

export const NewSubforumMemberNotification = registerNotificationType({
  name: "newSubforumMember",
  userSettingField: "notificationGroupAdministration",
  async getMessage({documentType, documentId}: GetMessageProps) {
    if (documentType !== 'user') throw new Error("documentType must be user")
    const newUser = await Users.findOne(documentId)
    if (!newUser) throw new Error("Cannot find new user for which this notification is being sent")
    return `A new user has joined your topic: ${newUser.displayName}`
  },
  getIcon() {
    return <SupervisedUserCircleIcon style={iconStyles} />
  }
})

export const NewCommentOnDraftNotification = registerNotificationType({
  name: "newCommentOnDraft",
  userSettingField: "notificationCommentsOnDraft",
  async getMessage({documentType, documentId}: GetMessageProps) {
    const post = await getDocument(documentType, documentId) as DbPost;
    return `New comments on your draft ${post.title}`;
  },
  
  getIcon() {
    return <CommentsIcon style={iconStyles}/>
  },
  
  onsiteHoverView({notification}: {notification: NotificationsList}) {
    return <Components.CommentOnYourDraftNotificationHover notification={notification}/>
  },
  
  getLink: ({documentType, documentId, extraData}: {
    documentType: string|null,
    documentId: string|null,
    extraData: any
  }): string => {
    return `/editPost?postId=${documentId}`;
  },
});

export const CoauthorRequestNotification = registerNotificationType({
  name: 'coauthorRequestNotification',
  userSettingField: 'notificationSharedWithMe',
  async getMessage({documentType, documentId}: GetMessageProps) {
    const document = await getDocument(documentType, documentId) as DbPost;
    const name = await postGetAuthorName(document);
    return `${name} requested that you co-author their post: ${document.title}`;
  },
  getIcon() {
    return <GroupAddIcon style={iconStyles} />
  },
})

export const CoauthorAcceptNotification = registerNotificationType({
  name: 'coauthorAcceptNotification',
  userSettingField: 'notificationSharedWithMe',
  async getMessage({documentType, documentId}: GetMessageProps) {
    const document = await getDocument(documentType, documentId) as DbPost;
    return `Your co-author request for '${document.title}' was accepted`;
  },
  getIcon() {
    return <DoneIcon style={iconStyles} />
  },
})

export const NewMentionNotification = registerNotificationType({
  name: "newMention",
  userSettingField: "notificationNewMention",
  async getMessage({documentType, documentId}: GetMessageProps) {
    const summary = await getDocumentSummary(documentType, documentId)
    return `${summary?.associatedUserName} mentioned you in ${summary?.displayName}`
  },
  getIcon() {
    return <CommentsIcon style={iconStyles}/>
  },
})
