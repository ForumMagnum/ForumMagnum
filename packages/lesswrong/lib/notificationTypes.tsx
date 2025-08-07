import React, { FC } from 'react';
import { getPostCollaborateUrl, postGetAuthorName, postGetEditUrl } from './collections/posts/helpers';
import { commentGetAuthorName } from './collections/comments/helpers';
import { responseToText } from './collections/posts/constants';
import sortBy from 'lodash/sortBy';
import { REVIEW_NAME_IN_SITU } from './reviewUtils';
import startCase from 'lodash/startCase';
import { userGetDisplayName } from './collections/users/helpers'
import { Link } from './reactRouterWrapper';
import { isFriendlyUI } from '../themes/forumTheme';
import { sequenceGetPageUrl } from './collections/sequences/helpers';
import { tagGetUrl } from './collections/tags/helpers';
import isEqual from 'lodash/isEqual';
import { NotificationChannel } from "./collections/users/notificationFieldHelpers";
import keyBy from 'lodash/keyBy';
import type { NotificationDocument } from '@/server/collections/notifications/constants';
import { getCommentParentTitle, getDocument, getDocumentSummary, taggedPostMessage } from './notificationDataHelpers';

// We need enough fields here to render the user tooltip
type NotificationDisplayUser = Pick<
  UsersMinimumInfo,
  "_id" |
  "slug" |
  "createdAt" |
  "displayName" |
  "profileImageId" |
  "karma" |
  "deleted" |
  "htmlBio" |
  "postCount" |
  "commentCount"
>;

type NotificationDisplayLocalgroup = Pick<DbLocalgroup, "_id" | "name">;

// We need enough here to render the post tooltip
type NotificationDisplayPost = Pick<
  PostsList,
  "_id" |
  "slug" |
  "title" |
  "draft" |
  "url" |
  "isEvent" |
  "startTime" |
  "curatedDate" |
  "postedAt" |
  "groupId" |
  "fmCrosspost" |
  "collabEditorDialogue" |
  "readTimeMinutes" |
  "socialPreviewData" |
  "customHighlight" |
  "contents"
> & Pick<DbPost, "rsvps"> & {
  user?: NotificationDisplayUser,
  group?: NotificationDisplayLocalgroup,
};

type NotificationDisplayComment = Pick<DbComment, "_id"> & {
  user?: NotificationDisplayUser,
  post?: NotificationDisplayPost,
};

type NotificationDisplayTag = Pick<DbTag, "_id" | "name" | "slug">;

type NotificationDisplaySequence = Pick<DbSequence, "_id" | "title">;

/** Main type for the notifications page */
export type NotificationDisplay =
  Pick<
    DbNotification,
    "_id" | "type" | "link" | "viewed" | "message" | "createdAt" | "extraData"
  > & {
    post?: NotificationDisplayPost,
    comment?: NotificationDisplayComment,
    tag?: NotificationDisplayTag,
    sequence?: NotificationDisplaySequence,
    user?: NotificationDisplayUser,
    localgroup?: NotificationDisplayLocalgroup,
    tagRelId?: string,
  };

export interface GetMessageProps {
  documentType: NotificationDocument | null
  documentId: string | null
  extraData?: Record<string,any>
  context: ResolverContext
}

interface GetDialogueMessageProps {
  documentType: NotificationDocument | null
  documentId: string | null
  newMessageAuthorId: string
  newMessageContents: string
}

export interface NotificationType<Name extends string> {
  name: Name
  userSettingField: (keyof DbUser & `notification${string}`)|null
  allowedChannels?: NotificationChannel[],
  getMessage: (args: {documentType: NotificationDocument|null, documentId: string|null, extraData?: Record<string,any>, context: ResolverContext}) => Promise<string>
  Display?: FC<{
    notification: NotificationDisplay,
    User: FC,
    LazyUser: FC<{userId: string}>,
    Post: FC,
    Comment: FC,
    Tag: FC,
    Sequence: FC,
    Localgroup: FC,
  }>,
  getLink?: (props: { documentType: string|null, documentId: string|null, extraData: Record<string,any> }) => string
  causesRedBadge?: boolean
}

const createNotificationType = <Name extends string>({allowedChannels = ["onsite", "email"], ...otherArgs}: NotificationType<Name>) => {
  const notificationTypeClass = {allowedChannels, ...otherArgs};
  return notificationTypeClass;
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

export const NewPostNotification = createNotificationType({
  name: "newPost",
  userSettingField: "notificationSubscribedUserPost",
  async getMessage({documentType, documentId, context}: GetMessageProps) {
    let document: DbPost = await getDocument(documentType, documentId, context) as DbPost;
    return await postGetAuthorName(document, context) + ' has created a new post: ' + document.title;
  },
  Display: ({User, Post}) => <><User /> created a new post <Post /></>,
});

export const NewUserCommentNotification = createNotificationType({
  name: "newUserComment",
  userSettingField: "notificationSubscribedUserComment",
  async getMessage({documentType, documentId, context}: GetMessageProps) {
    let document: DbComment = await getDocument(documentType, documentId, context) as DbComment;
    return await commentGetAuthorName(document, context) + ' left a new comment on the post ' + await getCommentParentTitle(document, context);
  },
  Display: ({User, Comment}) => <><User /> left a new <Comment /></>,
});

// Vulcan notification that we don't really use
export const PostApprovedNotification = createNotificationType({
  name: "postApproved",
  userSettingField: null, //TODO
  async getMessage({documentType, documentId, context}: GetMessageProps) {
    let document: DbPost = await getDocument(documentType, documentId, context) as DbPost;
    return 'Your post "' + document.title + '" has been approved';
  },
  Display: ({Post}) => <>Your post <Post /> has been approved</>,
});

export const PostNominatedNotification = createNotificationType({
  name: "postNominated",
  userSettingField: "notificationPostsNominatedReview",
  async getMessage({documentType, documentId, context}: GetMessageProps) {
    let post: DbPost = await getDocument(documentType, documentId, context) as DbPost;
    return `Your post is nominated for the ${REVIEW_NAME_IN_SITU}: "${post.title}"`
  },
})

export const NewEventNotification = createNotificationType({
  name: "newEvent",
  userSettingField: "notificationPostsInGroups",
  async getMessage({documentType, documentId, context}: GetMessageProps) {
    const { Localgroups } = context;
    let document = await getDocument(documentType, documentId, context);
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
      return await postGetAuthorName(document as DbPost, context) + ' has created a new event';
  },
  Display: ({User, Localgroup, notification: {post}}) => <>
    {post?.groupId ? <Localgroup /> : <User />} has created a new event
  </>,
});

export const NewGroupPostNotification = createNotificationType({
  name: "newGroupPost",
  userSettingField: "notificationPostsInGroups",
  async getMessage({documentType, documentId, context}: GetMessageProps) {
    const { Localgroups } = context;
    let document = await getDocument(documentType, documentId, context);
    let group: DbLocalgroup|null = null
    if (documentType === "post") {
      const post = document as DbPost
      if (post.groupId) {
        group = await Localgroups.findOne(post.groupId);
      }
    }
    if (group)
      return await postGetAuthorName(document as DbPost, context) + ' has created a new post in the group "' + group.name + '"';
    else
      return await postGetAuthorName(document as DbPost, context) + ' has created a new post in a group';
  },
  Display: ({User, Localgroup, notification: {post}}) => <>
    <User /> has created a new post in {
      post?.group
        ? <>the group <Localgroup /></>
        : <>a group</>
    }
  </>,
});

// New comment on a post you're subscribed to.
export const NewCommentNotification = createNotificationType({
  name: "newComment",
  userSettingField: "notificationCommentsOnSubscribedPost",
  async getMessage({documentType, documentId, context}: GetMessageProps) {
    let document = await getDocument(documentType, documentId, context) as DbComment;
    return await commentGetAuthorName(document, context) + ' left a new comment on "' + await getCommentParentTitle(document, context) + '"';
  },
  Display: ({User, Comment, Post}) => <>
    <User /> left a new <Comment /> on <Post />
  </>,
});

// New comment on a subforum you're subscribed to.
export const NewSubforumCommentNotification = createNotificationType({
  name: "newSubforumComment",
  userSettingField: "notificationSubforumUnread",
  async getMessage({documentType, documentId, context}: GetMessageProps) {
    // e.g. "Forecasting: Will Howard left a new comment"
    let document = await getDocument(documentType, documentId, context) as DbComment;
    return `${startCase(await getCommentParentTitle(document, context))}: ${await commentGetAuthorName(document, context)} left a new comment`;
  },
  // We don't have the exact data here to format this the same as above, but
  // subforums don't exist anymore so it doesn't seem worth the effort to fix
  Display: ({User, Comment, Post}) => <>
    <User /> left a new <Comment /> on <Post />
  </>,
});

// New message in a dialogue which you are a participant
// (Notifications for regular comments are handled through the `newComment` notification.)
export const NewDialogueMessagesNotification = createNotificationType({
  name: "newDialogueMessages",
  userSettingField: "notificationDialogueMessages",
  async getMessage({documentType, documentId, extraData, context}: GetMessageProps) {

    const newMessageAuthorId = extraData?.newMessageAuthorId
    let post = await getDocument(documentType, documentId, context) as DbPost;
    let author = await getDocument("user", newMessageAuthorId, context) as DbUser ?? '[Missing Author Name]';

    return userGetDisplayName(author) + ' left a new reply in your dialogue "' + post.title + '"';
  },
  getLink: ({documentId}: {
    documentId: string|null,
  }): string => {
    return `/editPost?postId=${documentId}`;
  },
  causesRedBadge: true,
  Display: ({User, Post}) => <><User /> left a new reply in your dialogue <Post /></>,
});

// Used when a user already has unread dialogue message notification. Primitive batching to prevent spamming the user.
// Send instead of NewDialogueMessageNotifications when there is already one already unread. Not sent if another instance of itself is unread.
export const NewDialogueMessagesBatchNotification = createNotificationType({
  name: "newDialogueBatchMessages",
  //using same setting as regular NewDialogueMessageNotification, since really the same
  userSettingField: "notificationDialogueMessages",
  async getMessage({documentType, documentId, context}: GetMessageProps) {
    const post = await getDocument(documentType, documentId, context) as DbPost;

    return 'Multiple new messages in your dialogue "' + post.title + '"';
  },
  getLink: ({documentId}: {
    documentId: string|null,
  }): string => {
    return `/editPost?postId=${documentId}`;
  },
  Display: ({Post}) => <>Multiple new messages in your dialogue <Post /></>,
});

// New published dialogue message(s) on a dialogue post you're subscribed to. 
// (Notifications for regular comments are still handled through the `newComment` notification.)
export const NewPublishedDialogueMessagesNotification = createNotificationType({
  name: "newPublishedDialogueMessages",
  userSettingField: "notificationPublishedDialogueMessages",
  async getMessage({documentType, documentId, context}: GetMessageProps) {
    let post = await getDocument(documentType, documentId, context) as DbPost;
    return `New content in the dialogue "${post.title}"`;
  },
  causesRedBadge: false,
  Display: ({Post}) => <>New content in the dialogue <Post /></>,
});

// New dialogue match between you and another user
export const NewDialogueMatchNotification = createNotificationType({
  name: "newDialogueMatch",
  userSettingField: "notificationDialogueMatch",
  async getMessage({documentType, documentId}: GetMessageProps) {
    return "This is an old notification for a deprecated feature."
  },
});

// Notification that you have new interested parties for dialogues
export const NewDialogueCheckNotification = createNotificationType({
  name: "newDialogueChecks",
  userSettingField: "notificationNewDialogueChecks",
  allowedChannels: ["onsite"],
  async getMessage(props: GetMessageProps) {
    return "This is an old notification for a deprecated feature."
  },
});

export const YourTurnMatchFormNotification = createNotificationType({
  name: "yourTurnMatchForm",
  userSettingField: "notificationYourTurnMatchForm",
  allowedChannels: ["onsite"],
  async getMessage({documentType, documentId}: GetMessageProps) {
    return "This is an old notification for a deprecated feature."
  },
});

//NOTIFICATION FOR OLD DIALOGUE FORMAT
//TO-DO: clean up eventually
// New debate comment on a debate post you're subscribed to.  For readers explicitly subscribed to the debate.
// (Notifications for regular comments are still handled through the `newComment` notification.)
export const NewDebateCommentNotification = createNotificationType({
  name: "newDebateComment",
  userSettingField: "notificationDebateCommentsOnSubscribedPost",
  async getMessage({documentType, documentId, context}: GetMessageProps) {
    let document = await getDocument(documentType, documentId, context) as DbComment;
    return await commentGetAuthorName(document, context) + ' left a new reply on the dialogue "' + await getCommentParentTitle(document, context) + '"';
  },
});

//NOTIFICATION FOR OLD DIALOGUE FORMAT
//TO-DO: clean up eventually
// New debate comment on a debate post you're subscribed to.  For debate participants implicitly subscribed to the debate.
// (Notifications for regular comments are still handled through the `newComment` notification.)
export const NewDebateReplyNotification = createNotificationType({
  name: "newDebateReply",
  userSettingField: "notificationDebateReplies",
  async getMessage({documentType, documentId, context}: GetMessageProps) {
    let document = await getDocument(documentType, documentId, context) as DbComment;
    return await commentGetAuthorName(document, context) + ' left a new reply on the dialogue "' + await getCommentParentTitle(document, context) + '"';
  },
  causesRedBadge: true,
});

export const NewShortformNotification = createNotificationType({
  name: "newShortform",
  userSettingField: "notificationShortformContent",
  async getMessage({documentType, documentId, context}: GetMessageProps) {
    let document = await getDocument(documentType, documentId, context) as DbComment;
    return 'New comment on "' + await getCommentParentTitle(document, context) + '"';
  },
  Display: ({User, Comment, Post}) => <>
    <User /> left a new <Comment /> on <Post />
  </>,
});

export const NewTagPostsNotification = createNotificationType({
  name: "newTagPosts",
  userSettingField: "notificationSubscribedTagPost",
  async getMessage({documentType, documentId, context}: GetMessageProps) {
    return await taggedPostMessage({documentType, documentId, context})
  },
  Display: ({Tag, Post}) => <>New post tagged <Tag />: <Post /></>,
});

export const NewSequencePostsNotification = createNotificationType({
  name: "newSequencePosts",
  userSettingField: "notificationSubscribedSequencePost",
  async getMessage({documentType, documentId, context}: GetMessageProps) {
    const sequence = await getDocument(documentType, documentId, context) as DbSequence;
    return `Posts added to ${sequence.title}`
  },
  getLink({documentId}) {
    return documentId ? sequenceGetPageUrl({_id: documentId}) : "#";
  },
  Display: ({Sequence}) => <>Posts added to <Sequence /></>,
});

// Reply to a comment you're subscribed to.
export const NewReplyNotification = createNotificationType({
  name: "newReply",
  userSettingField: "notificationRepliesToSubscribedComments",
  async getMessage({documentType, documentId, context}: GetMessageProps) {
    let document = await getDocument(documentType, documentId, context) as DbComment;
    return await commentGetAuthorName(document, context) + ' replied to a comment on "' + await getCommentParentTitle(document, context) + '"';
  },
  Display: ({User, Comment, Post}) => <>
    <User /> replied to a <Comment /> on <Post />
  </>,
});

// Reply to a comment you are the author of.
export const NewReplyToYouNotification = createNotificationType({
  name: "newReplyToYou",
  userSettingField: "notificationRepliesToMyComments",
  async getMessage({documentType, documentId, context, extraData}: GetMessageProps) {
    let document = await getDocument(documentType, documentId, context) as DbComment;
    if (extraData?.direct === false) {
      return await commentGetAuthorName(document, context) + ' replied to a thread you\'re in on "' + await getCommentParentTitle(document, context) + '"';
    } else {
      return await commentGetAuthorName(document, context) + ' replied to your comment on "' + await getCommentParentTitle(document, context) + '"';
    }
  },
  Display: ({notification, User, Comment, Post}) => {
    const isDirect = notification.extraData?.direct !== false;
    return <>
      <User /> replied to {isDirect ? 'your comment' : 'a thread you\'re in'} on <Post />
    </>;
  },
});

// Vulcan notification that we don't really use
export const NewUserNotification = createNotificationType({
  name: "newUser",
  userSettingField: null,
  async getMessage({documentType, documentId, context}: GetMessageProps) {
    let document = await getDocument(documentType, documentId, context) as DbUser;
    return document.displayName + ' just signed up!';
  },
  Display: ({User}) => <><User /> just signed up</>,
});

// This has no `Display` as messages are handled separately from notifications
// in the friendly UI
export const NewMessageNotification = createNotificationType({
  name: "newMessage",
  userSettingField: "notificationPrivateMessage",
  async getMessage({documentType, documentId, context}: GetMessageProps) {
    const { Users, Conversations } = context;

    let document = await getDocument(documentType, documentId, context) as DbMessage;
    let conversation = await Conversations.findOne(document.conversationId);
    return (await Users.findOne(document.userId))?.displayName + ' sent you a new message' + (conversation?.title ? (' in the conversation ' + conversation.title) : "") + '!';
  },
  causesRedBadge: !isFriendlyUI,
});

export const WrappedNotification = createNotificationType({
  name: "wrapped",
  userSettingField: null,
  async getMessage({extraData}: GetMessageProps) {
    return `Check out your ${extraData?.year ?? 2023} EA Forum Wrapped`;
  },
  getLink() {
    return "/wrapped"
  },
  Display: ({notification: {link, extraData}}) => <>
    Check out your {extraData?.year ?? 2023} <Link to={link}>EA Forum Wrapped</Link>
  </>,
});

// TODO(EA): Fix notificationCallbacks getLink, or the associated component to
// be EA-compatible. Currently we just disable it in the new user callback.
export const EmailVerificationRequiredNotification = createNotificationType({
  name: "emailVerificationRequired",
  userSettingField: null,
  async getMessage({documentType, documentId}: GetMessageProps) {
    return "Verify your email address to activate email subscriptions.";
  },
  Display: () => <>Verify your email address to activate email subscriptions</>,
});

export const PostSharedWithUserNotification = createNotificationType({
  name: "postSharedWithUser",
  userSettingField: "notificationSharedWithMe",
  async getMessage({documentType, documentId, context}: GetMessageProps) {
    let document = await getDocument(documentType, documentId, context) as DbPost;
    const name = await postGetAuthorName(document, context);
    return `${name} shared their ${document.draft ? "draft" : "post"} "${document.title}" with you`;
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
  },
  Display: ({User, Post, notification: {post}}) => <>
    <User /> shared their {post?.draft ? "draft" : "post"} <Post /> with you
  </>,
});

export const PostAddedAsCoauthorNotification = createNotificationType({
  name: "addedAsCoauthor",
  userSettingField: "notificationAddedAsCoauthor",
  async getMessage({documentType, documentId, context}: GetMessageProps) {
    let document = await getDocument(documentType, documentId, context) as DbPost;
    const name = await postGetAuthorName(document, context);
    const postOrDialogue = document.collabEditorDialogue ? 'dialogue' : 'post';
    return `${name} added you as a coauthor to the ${postOrDialogue} "${document.title}"`;
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
  },
  Display: ({User, Post, notification: {post}}) => {
    const postOrDialogue = post?.collabEditorDialogue ? "dialogue" : "post";
    return <>
      <User /> added you as a coauthor to the {postOrDialogue} <Post />
    </>;
  },
});

export const AlignmentSubmissionApprovalNotification = createNotificationType({
  name: "alignmentSubmissionApproved",
  userSettingField: "notificationAlignmentSubmissionApproved",
  async getMessage({documentType, documentId, context}: GetMessageProps) {
    
    if (documentType==='comment') {
      return "Your comment has been accepted to the Alignment Forum";
    } else if (documentType==='post') {
      let post = await getDocument(documentType, documentId, context) as DbPost
      return `Your post has been accepted to the Alignment Forum: ${post.title}`
    } else throw new Error("documentType must be post or comment!")
  },
});

export const NewEventInNotificationRadiusNotification = createNotificationType({
  name: "newEventInRadius",
  userSettingField: "notificationEventInRadius",
  async getMessage({documentType, documentId, context}: GetMessageProps) {
    let document = await getDocument(documentType, documentId, context) as DbPost
    return `New event in your area: ${document.title}`
  },
  Display: ({Post}) => <>New event in your area: <Post /></>,
})

export const EditedEventInNotificationRadiusNotification = createNotificationType({
  name: "editedEventInRadius",
  userSettingField: "notificationEventInRadius",
  async getMessage({documentType, documentId, context}: GetMessageProps) {
    let document = await getDocument(documentType, documentId, context) as DbPost
    return `Event in your area updated: ${document.title}`
  },
  Display: ({Post}) => <>Event in your area updated: <Post /></>,
})


export const NewRSVPNotification = createNotificationType({
  name: "newRSVP",
  userSettingField: "notificationRSVPs",
  async getMessage({documentType, documentId, context}: GetMessageProps) {
    const document = await getDocument(documentType, documentId, context) as DbPost
    const rsvps = document.rsvps || []
    const lastRSVP = sortBy(rsvps, r => r.createdAt)[rsvps.length - 1]
    return `${lastRSVP.name} responded "${responseToText[lastRSVP.response]}" to your event ${document.title}`
  },
  Display: ({Post, LazyUser, notification: {post}}) => {
    const rsvps = post?.rsvps ?? [];
    const lastRsvp = sortBy(rsvps, (r) => r.createdAt)[rsvps.length - 1];
    if (!lastRsvp?.userId) {
      return <>Someone responded to your event <Post /></>;
    }
    return <>
      <LazyUser userId={lastRsvp.userId} /> responded to your event <Post />
    </>
  },
})

export const KarmaPowersGainedNotification = createNotificationType({
  name: "karmaPowersGained",
  userSettingField: "notificationKarmaPowersGained",
  async getMessage() {
    return "Your votes are stronger because your karma went up!"
  },
  getLink() {
    return tagGetUrl({slug: 'vote-strength'});
  },
})
export const CancelledRSVPNotification = createNotificationType({
  name: "cancelledRSVP",
  userSettingField: "notificationRSVPs",
  async getMessage({documentType, documentId, context}: GetMessageProps) {
    const document = await getDocument(documentType, documentId, context) as DbPost
    return `Someone cancelled their RSVP to your event ${document.title}`
  },
  Display: ({Post}) => <>Someone cancelled their RSVP to your event <Post /></>,
})

export const NewGroupOrganizerNotification = createNotificationType({
  name: "newGroupOrganizer",
  userSettingField: "notificationGroupAdministration",
  async getMessage({documentType, documentId, context}: GetMessageProps) {
    const { Localgroups } = context;
    if (documentType !== 'localgroup') throw new Error("documentType must be localgroup")
    const localGroup = await Localgroups.findOne(documentId)
    if (!localGroup) throw new Error("Cannot find local group for which this notification is being sent")
    return `You've been added as an organizer of ${localGroup.name}`
  },
  Display: ({Localgroup}) => <>You've been added as an organizer of <Localgroup /></>,
})

export const NewSubforumMemberNotification = createNotificationType({
  name: "newSubforumMember",
  userSettingField: "notificationGroupAdministration",
  async getMessage({documentType, documentId, context}: GetMessageProps) {
    const { Users } = context;
    if (documentType !== 'user') throw new Error("documentType must be user")
    const newUser = await Users.findOne(documentId)
    if (!newUser) throw new Error("Cannot find new user for which this notification is being sent")
    return `A new user has joined your topic: ${newUser.displayName}`
  },
  Display: ({User, Tag}) => <><User /> has joined <Tag /></>,
})

export const NewCommentOnDraftNotification = createNotificationType({
  name: "newCommentOnDraft",
  userSettingField: "notificationCommentsOnDraft",
  async getMessage({documentType, documentId, context}: GetMessageProps) {
    const post = await getDocument(documentType, documentId, context) as DbPost;
    return `New comments on your draft ${post.title}`;
  },
  
  
  getLink: ({documentType, documentId, extraData}: {
    documentType: string|null,
    documentId: string|null,
    extraData: any
  }): string => {
    if (!documentId) {
      throw new Error("NewCommentOnDraftNotification documentId is missing");
    }
    const { linkSharingKey } = extraData;
    const url = postGetEditUrl(documentId, false, linkSharingKey);
    return url;
  },
  Display: ({Post}) => <>New comments on your draft <Post /></>,
});

export const CoauthorRequestNotification = createNotificationType({
  name: 'coauthorRequestNotification',
  userSettingField: 'notificationSharedWithMe',
  async getMessage({documentType, documentId, context}: GetMessageProps) {
    const document = await getDocument(documentType, documentId, context) as DbPost;
    const name = await postGetAuthorName(document, context);
    return `${name} requested that you co-author their post: ${document.title}`;
  },
  Display: ({User, Post}) => <>
    <User /> requested that you co-author their post <Post />
  </>,
})

export const CoauthorAcceptNotification = createNotificationType({
  name: 'coauthorAcceptNotification',
  userSettingField: 'notificationSharedWithMe',
  async getMessage({documentType, documentId, context}: GetMessageProps) {
    const document = await getDocument(documentType, documentId, context) as DbPost;
    return `Your co-author request for '${document.title}' was accepted`;
  },
  Display: ({Post}) => <>Your co-author request for <Post /> was accepted</>,
})

export const NewMentionNotification = createNotificationType({
  name: "newMention",
  userSettingField: "notificationNewMention",
  async getMessage({documentType, documentId, context}: GetMessageProps) {
    const summary = await getDocumentSummary(documentType, documentId, context)
    return `${summary?.associatedUserName} mentioned you in ${summary?.displayName}`
  },
  Display: ({User, Comment, Post, Tag, notification: {comment, tag}}) => {
    if (tag) {
      return (
        <><User /> mentioned you in <Tag /></>
      );
    }
    return (
      <><User /> mentioned you in {comment ? <>their <Comment /> on </> : ""}<Post /></>
    );
  },
})

const notificationTypesArray = [
  NewPostNotification,
  NewUserCommentNotification,
  PostApprovedNotification,
  PostNominatedNotification,
  NewEventNotification,
  NewGroupPostNotification,
  NewCommentNotification,
  NewSubforumCommentNotification,
  NewDialogueMessagesNotification,
  NewDialogueMessagesBatchNotification,
  NewPublishedDialogueMessagesNotification,
  NewDialogueMatchNotification,
  NewDialogueCheckNotification,
  YourTurnMatchFormNotification,
  NewDebateCommentNotification,
  NewDebateReplyNotification,
  NewShortformNotification,
  NewTagPostsNotification,
  NewSequencePostsNotification,
  NewReplyNotification,
  NewReplyToYouNotification,
  NewUserNotification,
  NewMessageNotification,
  WrappedNotification,
  EmailVerificationRequiredNotification,
  PostSharedWithUserNotification,
  PostAddedAsCoauthorNotification,
  AlignmentSubmissionApprovalNotification,
  NewEventInNotificationRadiusNotification,
  EditedEventInNotificationRadiusNotification,
  NewRSVPNotification,
  KarmaPowersGainedNotification,
  CancelledRSVPNotification,
  NewGroupOrganizerNotification,
  NewSubforumMemberNotification,
  NewCommentOnDraftNotification,
  CoauthorRequestNotification,
  CoauthorAcceptNotification,
  NewMentionNotification,
];

export type NotificationTypesByName = {
  [k in typeof notificationTypesArray[number]["name"]]: Extract<typeof notificationTypesArray[number], {name: k}>
}

const notificationTypes = keyBy(notificationTypesArray, n=>n.name) as NotificationTypesByName;

function groupNotificationTypesByUserSetting(notificationTypes: Record<string,NotificationType<string>>) {
  const result: Partial<Record<(keyof DbUser & `notification${string}`), NotificationType<string>>> = {};
  for (const notificationType of Object.values(notificationTypes)) {
    const { userSettingField } = notificationType;
    if (userSettingField) {
      // Due to a technical limitation notifications using the same user setting
      // must also use the same channels
      const currentValue = result[userSettingField];
      if (currentValue && !isEqual(currentValue.allowedChannels, notificationType.allowedChannels)) {
        // eslint-disable-next-line no-console
        console.error(`Error: Conflicting channels for notifications using "${userSettingField}"`);
      }
      result[userSettingField] = notificationType;
    }
  }
  return result;
}
const notificationTypesByUserSetting: Partial<Record<(keyof DbUser & `notification${string}`), NotificationType<string>>> = groupNotificationTypesByUserSetting(notificationTypes);


export const getNotificationTypes = () => {
  return Object.keys(notificationTypes);
}

export function isNotificationTypeName(name: string): name is keyof NotificationTypesByName {
  return name in notificationTypes;
}

export const getNotificationTypeByName = <Name extends string>(name: Name) => {
  if (isNotificationTypeName(name)) {
    return notificationTypes[name];
  }
  else
    throw new Error(`Invalid notification type: ${name}`);
}

export const getNotificationTypeByUserSetting = (settingName: keyof DbUser & `notification${string}`): NotificationType<string> => {
  const result = notificationTypesByUserSetting[settingName];
  if (!result) throw new Error("Setting does not correspond to a notification type");
  return result;
}
