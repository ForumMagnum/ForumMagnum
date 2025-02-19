import React from 'react';
import { Components } from '../lib/vulcan-lib/components';
import { makeAbsolute, getSiteUrl, combineUrls } from '../lib/vulcan-lib/utils';
import { Posts } from '../lib/collections/posts/collection';
import { postGetPageUrl, postGetAuthorName, postGetEditUrl } from '../lib/collections/posts/helpers';
import { Comments } from '../lib/collections/comments/collection';
import { Localgroups } from '../lib/collections/localgroups/collection';
import { Messages } from '../lib/collections/messages/collection';
import { TagRels } from '../lib/collections/tagRels/collection';
import { Conversations } from '../lib/collections/conversations/collection';
import { accessFilterMultiple } from '../lib/utils/schemaUtils';
import keyBy from 'lodash/keyBy';
import Users from '../lib/collections/users/collection';
import { userGetDisplayName, userGetProfileUrl } from '../lib/collections/users/helpers';
import * as _ from 'underscore';
import './emailComponents/EmailComment';
import './emailComponents/PrivateMessagesEmail';
import './emailComponents/EventUpdatedEmail';
import './emailComponents/EmailUsernameByID';
import './emailComponents/SequenceNewPostsEmail';
import {getDocumentSummary, taggedPostMessage, NotificationDocument, getDocument} from '../lib/notificationTypes'
import { commentGetPageUrlFromIds } from "../lib/collections/comments/helpers";
import { getReviewTitle, REVIEW_YEAR } from '../lib/reviewUtils';
import { ForumOptions, forumSelect } from '../lib/forumTypeUtils';
import { forumTitleSetting, siteNameWithArticleSetting } from '../lib/instanceSettings';
import Tags from '../lib/collections/tags/collection';
import { tagGetSubforumUrl } from '../lib/collections/tags/helpers';
import uniq from 'lodash/uniq';
import startCase from 'lodash/startCase';
import { DialogueMessageEmailInfo } from './emailComponents/NewDialogueMessagesEmail';
import Sequences from '../lib/collections/sequences/collection';

interface ServerNotificationType {
  name: string,
  from?: string,
  canCombineEmails?: boolean,
  skip: ({user, notifications}: {user: DbUser, notifications: DbNotification[]}) => Promise<boolean>,
  loadData?: ({user, notifications}: {user: DbUser, notifications: DbNotification[]}) => Promise<any>,
  emailSubject: ({user, notifications}: {user: DbUser, notifications: DbNotification[]}) => Promise<string>,
  emailBody: ({user, notifications}: {user: DbUser, notifications: DbNotification[]}) => Promise<React.ReactNode>,
}
// A default skip function is added in serverRegisterNotificationType so it is optional when registering a notification type
type ServerRegisterNotificationType = Omit<ServerNotificationType, 'skip'> & Partial<Pick<ServerNotificationType, 'skip'>>

const notificationTypes: Record<string, ServerNotificationType> = {};

export const getNotificationTypeByNameServer = (name: string): ServerNotificationType => {
  if (name in notificationTypes)
    return notificationTypes[name];
  else
    throw new Error(`Invalid notification type: ${name}`);
}

const serverRegisterNotificationType = ({skip = async () => false, ...notificationTypeClass}: ServerRegisterNotificationType): ServerNotificationType => {
  const notificationType = {skip, ...notificationTypeClass};
  const name = notificationType.name;
  notificationTypes[name] = notificationType;
  return notificationType;
}

export const NewPostNotification = serverRegisterNotificationType({
  name: "newPost",
  canCombineEmails: false,
  emailSubject: async ({ user, notifications }: {user: DbUser, notifications: DbNotification[]}) => {
    const postId = notifications[0].documentId;
    const post = await Posts.findOne({_id: postId});
    if (!post) throw Error(`Can't find post to generate subject-line for: ${postId}`)
    return post.title;
  },
  emailBody: async ({ user, notifications }: {user: DbUser, notifications: DbNotification[]}) => {
    const postId = notifications[0].documentId;
    if (!postId) throw Error(`Can't find post to generate body for: ${postId}`)
    return <Components.NewPostEmail documentId={postId}/>
  },
});

// Vulcan notification that we don't really use
export const PostApprovedNotification = serverRegisterNotificationType({
  name: "postApproved",
  emailSubject: async ({ user, notifications }: {user: DbUser, notifications: DbNotification[]}) => {
    return "LessWrong notification";
  },
  emailBody: async ({ user, notifications }: {user: DbUser, notifications: DbNotification[]}) => null
});

export const NewEventNotification = serverRegisterNotificationType({
  name: "newEvent",
  canCombineEmails: false,
  emailSubject: async ({ user, notifications }: {user: DbUser, notifications: DbNotification[]}) => {
    const post = await Posts.findOne(notifications[0].documentId);
    if (!post) throw Error(`Can't find post to generate subject-line for: ${notifications}`)
    return `New event: ${post.title}`;
  },
  emailBody: async ({ user, notifications }: {user: DbUser, notifications: DbNotification[]}) => {
    const postId = notifications[0].documentId;
    if (!postId) throw Error(`Can't find event post to generate body for: ${postId}`)
    return <Components.NewPostEmail documentId={postId} hideRecommendations={true} reason="you are subscribed to this group"/>
  },
});

export const NewGroupPostNotification = serverRegisterNotificationType({
  name: "newGroupPost",
  canCombineEmails: false,
  emailSubject: async ({ user, notifications }: {user: DbUser, notifications: DbNotification[]}) => {
    const post = await Posts.findOne(notifications[0].documentId);
    const group = await Localgroups.findOne(post?.groupId);
    return `New post in group ${group?.name}`;
  },
  emailBody: async ({ user, notifications }: {user: DbUser, notifications: DbNotification[]}) => {
    const postId = notifications[0].documentId;
    if (!postId) throw Error(`Can't find group post to generate body for: ${postId}`)
    return <Components.NewPostEmail documentId={postId} hideRecommendations={true} reason="you are subscribed to this group"/>
  },
});

export const NominatedPostNotification = serverRegisterNotificationType({
  name: "postNominated",
  canCombineEmails: false,
  emailSubject: async ({user, notifications}: {user: DbUser, notifications: DbNotification[]}) => {
    return `Your post was nominated for the ${getReviewTitle(REVIEW_YEAR)}`
  },
  emailBody: async ({user, notifications}: {user: DbUser, notifications: DbNotification[]}) => {
    const postId = notifications[0].documentId;
    if (!postId) throw Error(`Can't find nominated post to generate body for: ${postId}`)
    return <Components.PostNominatedEmail documentId={postId} />
  }
})

export const NewShortformNotification = serverRegisterNotificationType({
  name: "newShortform",
  canCombineEmails: false,
  emailSubject: async ({user, notifications}: {user: DbUser, notifications: DbNotification[]}) => {
    const comment = await Comments.findOne(notifications[0].documentId)
    const post = comment?.postId && await Posts.findOne(comment.postId)
    // This notification type should never be triggered on tag-comments, so we just throw an error here
    if (!post) throw Error(`Can't find post to generate subject-line for: ${comment}`)
    return 'New comment on "' + post.title + '"';
  },
  emailBody: async ({user, notifications}: {user: DbUser, notifications: DbNotification[]}) => {
    const comment = await Comments.findOne(notifications[0].documentId)
    if (!comment) throw Error(`Can't find comment for comment email notification: ${notifications[0]}`)
    return <Components.EmailCommentBatch comments={[comment]}/>;
  }
})

export const NewTagPostsNotification = serverRegisterNotificationType({
  name: "newTagPosts",
  canCombineEmails: false,
  emailSubject: async ({user, notifications}: {user: DbUser, notifications: DbNotification[]}) => {
    const {documentId, documentType} = notifications[0]
    return await taggedPostMessage({documentId, documentType: documentType as NotificationDocument})
  },
  emailBody: async ({user, notifications}: {user: DbUser, notifications: DbNotification[]}) => {
    const {documentId, documentType} = notifications[0]
    const tagRel = await TagRels.findOne({_id: documentId})
    if (tagRel) {
      return <Components.NewPostEmail documentId={ tagRel.postId}/>
    }
  }
})

export const NewSequencePostsNotification = serverRegisterNotificationType({
  name: "newSequencePosts",
  canCombineEmails: false,
  emailSubject: async ({user, notifications}: {user: DbUser, notifications: DbNotification[]}) => {
    const sequence = await getDocument(notifications[0].documentType as NotificationDocument, notifications[0].documentId) as DbSequence;
    if (!sequence) throw Error(`Can't find sequence for notification: ${notifications[0]}`)
    return `Posts added to ${sequence.title}`
  },
  emailBody: async ({user, notifications}: {user: DbUser, notifications: DbNotification[]}) => {
    const {documentId, extraData} = notifications[0]
    
    const sequence = await Sequences.findOne({_id: documentId})
    if (!sequence) throw Error(`Can't find sequence for notification: ${notifications[0]}`)

    const posts = await Posts.find({
      _id: {$in: extraData.postIds},
      draft: {$ne: true},
      deletedDraft: {$ne: true},
    }).fetch()
    
    if (!posts.length) throw Error(`No valid new posts for notification: ${notifications[0]}`)
    
    return <Components.SequenceNewPostsEmail sequence={sequence} posts={posts} />;
  }
})

export const NewCommentNotification = serverRegisterNotificationType({
  name: "newComment",
  canCombineEmails: true,
  emailSubject: async ({ user, notifications }: {user: DbUser, notifications: DbNotification[]}) => {
    if (notifications.length > 1) {
      return `${notifications.length} comments on posts you subscribed to`;
    } else {
      const comment = await Comments.findOne(notifications[0].documentId);
      if (!comment) throw Error(`Can't find comment for notification: ${notifications[0]}`)
      const author = await Users.findOne(comment.userId);
      if (!author) throw Error(`Can't find author for new comment notification: ${notifications[0]}`)
      return `${author.displayName} commented on a post you subscribed to`;
    }
  },
  emailBody: async ({ user, notifications }: {user: DbUser, notifications: DbNotification[]}) => {
    const commentIds = notifications.map(n => n.documentId);
    const commentsRaw = await Comments.find({_id: {$in: commentIds}}).fetch();
    const comments = await accessFilterMultiple(user, Comments, commentsRaw, null);
    
    return <Components.EmailCommentBatch comments={comments}/>;
  },
});

export const NewUserCommentNotification = serverRegisterNotificationType({
  name: "newUserComment",
  canCombineEmails: true,
  emailSubject: async ({ user, notifications }: {user: DbUser, notifications: DbNotification[]}) => {
    if (notifications.length > 1) {
      return `${notifications.length} comments by users you subscribed to`;
    } else {
      const comment = await Comments.findOne(notifications[0].documentId);
      if (!comment) throw Error(`Can't find comment for notification: ${notifications[0]}`)
      const author = await Users.findOne(comment.userId);
      if (!author) throw Error(`Can't find author for new comment notification: ${notifications[0]}`)
      return `${author.displayName} left a new comment.`;
    }
  },
  emailBody: async ({ user, notifications }: {user: DbUser, notifications: DbNotification[]}) => {
    const commentIds = notifications.map(n => n.documentId);
    const commentsRaw = await Comments.find({_id: {$in: commentIds}}).fetch();
    const comments = await accessFilterMultiple(user, Comments, commentsRaw, null);
    
    return <Components.EmailCommentBatch comments={comments}/>;
  },
});

export const NewSubforumCommentNotification = serverRegisterNotificationType({
  name: "newSubforumComment",
  canCombineEmails: true,
  skip: async ({ user, notifications }: {user: DbUser, notifications: DbNotification[]}) => {
    const commentIds = notifications.map(n => n.documentId);
    const commentsRaw = await Comments.find({_id: {$in: commentIds}}).fetch();
    const comments = await accessFilterMultiple(user, Comments, commentsRaw, null);

    return comments.length === 0;
  },
  emailSubject: async ({ user, notifications }: {user: DbUser, notifications: DbNotification[]}) => {
    const commentIds = notifications.map(n => n.documentId);
    const commentsRaw = await Comments.find({_id: {$in: commentIds}}).fetch();
    const comments = await accessFilterMultiple(user, Comments, commentsRaw, null);

    const commentCount = comments.length
    const subforumIds = uniq(comments.map(c => c.tagId))

    if (subforumIds.length === 1) {
      const subforum = await Tags.findOne(subforumIds[0])
      return `${commentCount} new comment${commentCount > 1 ? 's' : ''} in the ${startCase(subforum?.name)} topic`
    } else {
      return `${commentCount} new comment${commentCount > 1 ? 's' : ''} in ${subforumIds.length} topics you are subscribed to`
    }
  },
  emailBody: async ({ user, notifications }: {user: DbUser, notifications: DbNotification[]}) => {
    const commentIds = notifications.map(n => n.documentId);
    const commentsRaw = await Comments.find({_id: {$in: commentIds}}).fetch();
    const comments = await accessFilterMultiple(user, Comments, commentsRaw, null);
    
    return <Components.EmailCommentBatch comments={comments}/>;
  },
});

export const NewDialogueMessageNotification = serverRegisterNotificationType({
  name: "newDialogueMessages",
  canCombineEmails: true,
  emailSubject: async ({ user, notifications }: {user: DbUser, notifications: DbNotification[]}) => {
    const post = await Posts.findOne(notifications[0].documentId);
    const authorId = notifications[0].extraData?.newMessageAuthorId
    const author = authorId && await Users.findOne(authorId)
    if (!post) throw Error(`Can't find dialogue for notification: ${notifications[0]}`)

    if (author) {
      return `${userGetDisplayName(author)} left a new reply in your dialogue, ${post.title}`
    }      

    return `New reply in your dialogue, ${post.title}`;
  },
  emailBody: async ({ user, notifications }: {user: DbUser, notifications: DbNotification[]}) => {
    const postId = notifications[0].documentId!; // We skip notifications without a documentId in the skip function
    const dialogueMessageEmailInfo = getDialogueMessageEmailInfo(notifications[0].extraData)
    return <Components.NewDialogueMessagesEmail documentId={postId} userId={user._id} dialogueMessageEmailInfo={dialogueMessageEmailInfo}/>;
  },
  skip: async ({ notifications }: {notifications: DbNotification[]}) => {
    return !notifications[0].documentId
  }
});

function getDialogueMessageEmailInfo(extraData?: AnyBecauseHard): DialogueMessageEmailInfo|undefined {
  if (!extraData) return undefined
  const messageContents = extraData.dialogueMessageInfo.dialogueMessageContents
  const messageAuthorId = extraData.newMessageAuthorId
  if (!messageContents || !messageAuthorId) return undefined
  return { messageContents, messageAuthorId }
}

export const NewDialogueMessageBatchNotification = serverRegisterNotificationType({
  name: "newDialogueBatchMessages",
  canCombineEmails: true,
  emailSubject: async ({ user, notifications }: {user: DbUser, notifications: DbNotification[]}) => {
    const post = await Posts.findOne(notifications[0].documentId);
    if (!post) throw Error(`Can't find dialogue for notification: ${notifications[0]}`)
    return `Multiple new messages in the dialogue you are participating in, ${post.title}`;
  },
  emailBody: async ({ user, notifications }: {user: DbUser, notifications: DbNotification[]}) => {
    const postId = notifications[0].documentId;
    if (!postId) throw Error(`Can't find dialogue to generate body for: ${postId}`)
    return <Components.NewDialogueMessagesEmail documentId={postId} userId={user._id}/>;
  },
});

//subscriber notification for dialogues
export const NewPublishedDialogueMessageNotification = serverRegisterNotificationType({
  name: "newPublishedDialogueMessages",
  canCombineEmails: true,
  emailSubject: async ({ user, notifications }: {user: DbUser, notifications: DbNotification[]}) => {
    const post = await Posts.findOne(notifications[0].documentId);
    if (!post) throw Error(`Can't find dialogue for notification: ${notifications[0]}`)
    return `New content in the dialogue you are subscribed to, ${post.title}`;
  },
  emailBody: async ({ user, notifications }: {user: DbUser, notifications: DbNotification[]}) => {
    const postId = notifications[0].documentId;
    if (!postId) throw Error(`Can't find dialogue to generate body for: ${postId}`)
    return <Components.NewDialogueMessagesEmail documentId={postId} userId={user._id}/>;
  },
});

export const NewDebateCommentNotification = serverRegisterNotificationType({
  name: "newDebateComment",
  canCombineEmails: true,
  emailSubject: async ({ user, notifications }: {user: DbUser, notifications: DbNotification[]}) => {
    if (notifications.length > 1) {
      return `${notifications.length} dialogue replies on dialogues you subscribed to`;
    } else {
      const comment = await Comments.findOne(notifications[0].documentId);
      if (!comment) throw Error(`Can't find comment for notification: ${notifications[0]}`)
      const author = await Users.findOne(comment.userId);
      if (!author) throw Error(`Can't find author for new dialogue comment notification: ${notifications[0]}`)
      return `${author.displayName} replied in a dialogue you subscribed to`;
    }
  },
  emailBody: async ({ user, notifications }: {user: DbUser, notifications: DbNotification[]}) => {
    const commentIds = notifications.map(n => n.documentId);
    const commentsRaw = await Comments.find({_id: {$in: commentIds}}).fetch();
    const comments = await accessFilterMultiple(user, Comments, commentsRaw, null);
    
    return <Components.EmailCommentBatch comments={comments}/>;
  },
});

export const NewDebateReplyNotification = serverRegisterNotificationType({
  name: "newDebateReply",
  canCombineEmails: true,
  emailSubject: async ({ user, notifications }: {user: DbUser, notifications: DbNotification[]}) => {
    if (notifications.length > 1) {
      return `${notifications.length} replies on dialogues you're participanting in'`;
    } else {
      const comment = await Comments.findOne(notifications[0].documentId);
      if (!comment) throw Error(`Can't find comment for notification: ${notifications[0]}`)
      const author = await Users.findOne(comment.userId);
      if (!author) throw Error(`Can't find author for new dialogue comment notification: ${notifications[0]}`)
      return `${author.displayName} replied in a dialogue you're participanting in`;
    }
  },
  emailBody: async ({ user, notifications }: {user: DbUser, notifications: DbNotification[]}) => {
    const commentIds = notifications.map(n => n.documentId);
    const commentsRaw = await Comments.find({_id: {$in: commentIds}}).fetch();
    const comments = await accessFilterMultiple(user, Comments, commentsRaw, null);
    
    return <Components.EmailCommentBatch comments={comments}/>;
  },
});

export const NewReplyNotification = serverRegisterNotificationType({
  name: "newReply",
  canCombineEmails: true,
  emailSubject: async ({ user, notifications }: {user: DbUser, notifications: DbNotification[]}) => {
    if (notifications.length > 1) {
      return `${notifications.length} replies to comments you're subscribed to`;
    } else {
      const comment = await Comments.findOne(notifications[0].documentId);
      if (!comment) throw Error(`Can't find comment for notification: ${notifications[0]}`)
      const author = await Users.findOne(comment.userId);
      if (!author) throw Error(`Can't find author for new comment notification: ${notifications[0]}`)
      return `${userGetDisplayName(author)} replied to a comment you're subscribed to`;
    }
  },
  emailBody: async ({ user, notifications }: {user: DbUser, notifications: DbNotification[]}) => {
    const commentIds = notifications.map(n => n.documentId);
    const commentsRaw = await Comments.find({_id: {$in: commentIds}}).fetch();
    const comments = await accessFilterMultiple(user, Comments, commentsRaw, null);
    
    return <Components.EmailCommentBatch comments={comments}/>;
  },
});

export const NewReplyToYouNotification = serverRegisterNotificationType({
  name: "newReplyToYou",
  canCombineEmails: true,
  emailSubject: async ({ user, notifications }: {user: DbUser, notifications: DbNotification[]}) => {
    if (notifications.length > 1) {
      return `${notifications.length} replies to your comments`;
    } else {
      const comment = await Comments.findOne(notifications[0].documentId);
      if (!comment) throw Error(`Can't find comment for notification: ${notifications[0]}`)
      const author = await Users.findOne(comment.userId);
      if (!author) throw Error(`Can't find author for new comment notification: ${notifications[0]}`)
      return `${userGetDisplayName(author)} replied to your comment`;
    }
  },
  emailBody: async ({ user, notifications }: {user: DbUser, notifications: DbNotification[]}) => {
    const commentIds = notifications.map(n => n.documentId);
    const commentsRaw = await Comments.find({_id: {$in: commentIds}}).fetch();
    const comments = await accessFilterMultiple(user, Comments, commentsRaw, null);
    
    return <Components.EmailCommentBatch comments={comments}/>;
  },
});

// Vulcan notification that we don't really use
export const NewUserNotification = serverRegisterNotificationType({
  name: "newUser",
  emailSubject: async ({ user, notifications }: {user: DbUser, notifications: DbNotification[]}) => {
    return "LessWrong notification";
  },
  emailBody: async ({ user, notifications }: {user: DbUser, notifications: DbNotification[]}) => null,
});

const newMessageEmails: ForumOptions<string | null> = {
  EAForum: 'The EA Forum <forum-noreply@effectivealtruism.org>',
  default: null,
}
const forumNewMessageEmail = forumSelect(newMessageEmails) ?? undefined

export const NewMessageNotification = serverRegisterNotificationType({
  name: "newMessage",
  from: forumNewMessageEmail, // passing in undefined will lead to default behavior
  loadData: async function({ user, notifications }: {user: DbUser, notifications: DbNotification[]}) {
    // Load messages
    const messageIds = notifications.map(notification => notification.documentId);
    const messagesRaw = await Messages.find({ _id: {$in: messageIds} }).fetch();
    const messages = await accessFilterMultiple(user, Messages, messagesRaw, null);
    
    // Load conversations
    const messagesByConversationId = keyBy(messages, message=>message.conversationId);
    const conversationIds = _.keys(messagesByConversationId);
    const conversationsRaw = await Conversations.find({ _id: {$in: conversationIds} }).fetch();
    const conversations = await accessFilterMultiple(user, Conversations, conversationsRaw, null);
    
    // Load participant users
    const participantIds = _.uniq(_.flatten(conversations.map(conversation => conversation.participantIds), true));
    const participantsRaw = await Users.find({ _id: {$in: participantIds} }).fetch();
    const participants = await accessFilterMultiple(user, Users, participantsRaw, null);
    const participantsById = keyBy(participants, u=>u._id);
    const otherParticipants = _.filter(participants, participant=>participant._id!==user._id);
    
    return { conversations, messages, participantsById, otherParticipants };
  },
  emailSubject: async function({ user, notifications }: {user: DbUser, notifications: DbNotification[]}) {
    const { conversations, otherParticipants } = await this.loadData!({ user, notifications });
    
    const otherParticipantNames = otherParticipants.map((u: DbUser)=>userGetDisplayName(u)).join(', ');
    
    return `Private message conversation${conversations.length>1 ? 's' : ''} with ${otherParticipantNames}`;
  },
  emailBody: async function({ user, notifications }: {user: DbUser, notifications: DbNotification[]}) {
    const { conversations, messages, participantsById } = await this.loadData!({ user, notifications });
    
    return <Components.PrivateMessagesEmail
      conversations={conversations}
      messages={messages}
      participantsById={participantsById}
    />
  },
});

export const WrappedNotification = serverRegisterNotificationType({
  name: "wrapped",
  emailSubject: async function() {
    return 'Your 2024 EA Forum Wrapped';
  },
  emailBody: async function({ user }: {user: DbUser}) {
    return <div>
      <p>
        Hi {user.displayName},
      </p>
      <p>
        Thanks for being part of our community this year!{' '}
        <a href={`${combineUrls(getSiteUrl(), 'wrapped')}?utm_medium=email`}>
          Check out your 2024 EA Forum Wrapped.
        </a>{' '}
        🎁
      </p>
      <p>
        - The {forumTitleSetting.get()} Team
      </p>
    </div>
  },
});

// This notification type should never be emailed (but is displayed in the
// on-site UI).
export const EmailVerificationRequiredNotification = serverRegisterNotificationType({
  name: "emailVerificationRequired",
  canCombineEmails: false,
  emailSubject: async ({ user, notifications }: {user: DbUser, notifications: DbNotification[]}) => {
    throw new Error("emailVerificationRequired notification should never be emailed");
  },
  emailBody: async ({ user, notifications }: {user: DbUser, notifications: DbNotification[]}) => {
    throw new Error("emailVerificationRequired notification should never be emailed");
  },
});

export const PostSharedWithUserNotification = serverRegisterNotificationType({
  name: "postSharedWithUser",
  canCombineEmails: false,
  emailSubject: async ({ user, notifications }: {user: DbUser, notifications: DbNotification[]}) => {
    let post = await Posts.findOne(notifications[0].documentId);
    if (!post) throw Error(`Can't find post for notification: ${notifications[0]}`)
    const name = await postGetAuthorName(post);
    return `${name} shared their ${post.draft ? "draft" : "post"} "${post.title}" with you`;
  },
  emailBody: async ({ user, notifications }: {user: DbUser, notifications: DbNotification[]}) => {
    const post = await Posts.findOne(notifications[0].documentId);
    if (!post) throw Error(`Can't find post for notification: ${notifications[0]}`)
    const link = postGetPageUrl(post, true);
    const name = await postGetAuthorName(post);
    return <p>
      {name} shared their {post.draft ? "draft" : "post"} <a href={link}>{post.title}</a> with you.
    </p>
  },
});

export const PostAddedAsCoauthorNotification = serverRegisterNotificationType({
  name: "addedAsCoauthor",
  canCombineEmails: false,
  emailSubject: async ({ user, notifications }: {user: DbUser, notifications: DbNotification[]}) => {
    let post = await Posts.findOne(notifications[0].documentId);
    if (!post) throw Error(`Can't find post for notification: ${notifications[0]}`)
    const name = await postGetAuthorName(post);
    const postOrDialogue = post.collabEditorDialogue ? 'dialogue' : 'post';
    return `${name} added you as a coauthor to the ${postOrDialogue} "${post.title}"`;
  },
  emailBody: async ({ user, notifications }: {user: DbUser, notifications: DbNotification[]}) => {
    const post = await Posts.findOne(notifications[0].documentId);
    if (!post) throw Error(`Can't find post for notification: ${notifications[0]}`)
    const link = postGetEditUrl(post._id, true);
    const name = await postGetAuthorName(post);
    const postOrDialogue = post.collabEditorDialogue ? 'dialogue' : 'post';

    return <p>
      {name} added you as a coauthor to the {postOrDialogue} <a href={link}>{post.title}</a>.
    </p>
  },
});

export const isComment = (document: DbPost | DbComment): document is DbComment => {
  if (document.hasOwnProperty("answer")) return true //only comments can be answers
  return false
}

export const AlignmentSubmissionApprovalNotification = serverRegisterNotificationType({
  name: "alignmentSubmissionApproved",
  canCombineEmails: false,
  emailSubject: async ({ user, notifications }: {user: DbUser, notifications: DbNotification[]}) => {
    return "Your submission to the Alignment Forum has been approved!";
  },
  emailBody: async ({ user, notifications }: {user: DbUser, notifications: DbNotification[]}) => {
    let document: DbPost|DbComment|null 
    document = await Posts.findOne(notifications[0].documentId);
    if (!document) {
      document = await Comments.findOne(notifications[0].documentId)
    }
    if (!document) throw Error(`Can't find document for notification: ${notifications[0]}`)

    if (isComment(document)) {
      const link = commentGetPageUrlFromIds({postId: document.postId!, commentId: document._id, isAbsolute: true})
      return <p>
        Your <a href={link}>comment submission</a> to the Alignment Forum has been approved.
      </p>
    }
    else {
      const link = postGetPageUrl(document, true)
      return <p>
        Your post, <a href={link}>{document.title}</a>, has been accepted to the Alignment Forum.
      </p>
    }
  },
});

export const NewEventInRadiusNotification = serverRegisterNotificationType({
  name: "newEventInRadius",
  canCombineEmails: false,
  emailSubject: async ({ user, notifications }: {user: DbUser, notifications: DbNotification[]}) => {
    let post = await Posts.findOne(notifications[0].documentId);
    if (!post) throw Error(`Can't find post for notification: ${notifications[0]}`)
    return `New event in your area: ${post.title}`;
  },
  emailBody: async ({ user, notifications }: {user: DbUser, notifications: DbNotification[]}) => {
    const postId = notifications[0].documentId;
    if (!postId) throw Error(`Can't find event to generate body for: ${postId}`)
    return <Components.NewPostEmail documentId={postId} hideRecommendations={true} reason="you are subscribed to nearby events notifications"/>
  },
});

export const EditedEventInRadiusNotification = serverRegisterNotificationType({
  name: "editedEventInRadius",
  canCombineEmails: false,
  emailSubject: async ({ user, notifications }: {user: DbUser, notifications: DbNotification[]}) => {
    let post = await Posts.findOne(notifications[0].documentId);
    if (!post) throw Error(`Can't find post for notification: ${notifications[0]}`)
    return `Event in your area updated: ${post.title}`;
  },
  emailBody: async ({ user, notifications }: {user: DbUser, notifications: DbNotification[]}) => {
    const postId= notifications[0].documentId
    if (!postId) throw Error(`Can't find event to generate body for: ${postId}`)
    return <Components.EventUpdatedEmail postId={postId} />
  },
});


export const NewRSVPNotification = serverRegisterNotificationType({
  name: "newRSVP",
  canCombineEmails: false,
  emailSubject: async ({ user, notifications }: {user: DbUser, notifications: DbNotification[]}) => {
    let post = await Posts.findOne(notifications[0].documentId);
    if (!post) throw Error(`Can't find post for notification: ${notifications[0]}`)
    return `New RSVP for your event: ${post.title}`;
  },
  emailBody: async ({ user, notifications }: {user: DbUser, notifications: DbNotification[]}) => {
    let post = await Posts.findOne(notifications[0].documentId);
    if (!post) throw Error(`Can't find post for notification: ${notifications[0]}`)
    return <div>
      <p>
        {notifications[0].message}
      </p>
      <p>
        <a href={postGetPageUrl(post,true)}>Event Link</a>
      </p>
    </div>
  },
});

export const KarmaPowersGainedNotification = serverRegisterNotificationType({
  name: "karmaPowersGained",
  canCombineEmails: false,
  emailSubject: async ({ user, notifications }: {user: DbUser, notifications: DbNotification[]}) => {
    return "Thank you for your contribution";
  },
  emailBody: async ({ user, notifications }: {user: DbUser, notifications: DbNotification[]}) => {
    return <div>
      Your votes are stronger because your karma went up!
    </div>
  },
});

export const NewGroupOrganizerNotification = serverRegisterNotificationType({
  name: "newGroupOrganizer",
  canCombineEmails: false,
  emailSubject: async ({ user, notifications }: {user: DbUser, notifications: DbNotification[]}) => {
    const localGroup = await Localgroups.findOne(notifications[0].documentId)
    if (!localGroup) throw new Error("Cannot find local group for which this notification is being sent")
    return `You've been added as an organizer of ${localGroup.name}`;
  },
  emailBody: async ({ user, notifications }: {user: DbUser, notifications: DbNotification[]}) => {
    const localGroup = await Localgroups.findOne(notifications[0].documentId)
    if (!localGroup) throw new Error("Cannot find local group for which this notification is being sent")
    
    const groupLink = `${getSiteUrl().slice(0,-1)}/groups/${localGroup._id}`
    
    return <div>
      <p>
        Hi {user.displayName},
      </p>
      <p>
        You've been assigned as a group organizer for <a href={groupLink}>{localGroup.name}</a> on {siteNameWithArticleSetting.get()}.
      </p>
      <p>
        We recommend you check the group's info and update it if necessary. You can also post your group's events on the forum, which get advertised to users based on relevance.
      </p>
      <p>
        - The {forumTitleSetting.get()} Team
      </p>
    </div>
  },
});

export const NewCommentOnDraftNotification = serverRegisterNotificationType({
  name: "newCommentOnDraft",
  canCombineEmails: true,
  
  emailSubject: async ({ user, notifications }: {user: DbUser, notifications: DbNotification[]}) => {
    const firstNotification = notifications[0];
    const post = await Posts.findOne({_id: firstNotification.documentId});
    if (notifications.length===1) {
      const { senderUserID, commentHtml } = firstNotification.extraData;
      const senderUser = await Users.findOne({_id: senderUserID});
      
      return `${senderUser?.displayName} commented on ${post?.title}`;
    } else {
      return `${notifications.length} comments on ${post?.title}`;
    }
  },
  emailBody: async ({ user, notifications }: {user: DbUser, notifications: DbNotification[]}) => {
    const firstNotification = notifications[0];
    if (!firstNotification.documentId) {
      throw new Error("NewCommentOnDraftNotification documentId is missing");
    }
    const post = await Posts.findOne({_id: firstNotification.documentId});
    const postTitle = post?.title;
    const postLink = postGetEditUrl(firstNotification.documentId, true, firstNotification.extraData?.linkSharingKey);
    const { EmailUsernameByID } = Components;
    
    return <div>
      {notifications.map((notification,i) => <div key={i}>
        <div><EmailUsernameByID userID={notification.extraData?.senderUserID}/> commented on <a href={postLink}>{postTitle}</a>:</div>
        <div>
          <blockquote dangerouslySetInnerHTML={{__html: notification.extraData?.commentHtml}}/>
        </div>
      </div>)}
    </div>
  }
});

export const PostCoauthorRequestNotification = serverRegisterNotificationType({
  name: "coauthorRequestNotification",
  canCombineEmails: false,
  emailSubject: async ({ user, notifications }: {user: DbUser, notifications: DbNotification[]}) => {
    let post = await Posts.findOne(notifications[0].documentId);
    if (!post) {
      throw Error(`Can't find post for notification: ${notifications[0]}`);
    }
    const name = await postGetAuthorName(post);
    return `${name} requested that you co-author their post: ${post.title}`;
  },
  emailBody: async ({ user, notifications }: {user: DbUser, notifications: DbNotification[]}) => {
    const post = await Posts.findOne(notifications[0].documentId);
    if (!post) {
      throw Error(`Can't find post for notification: ${notifications[0]}`);
    }
    const link = postGetPageUrl(post, true);
    const name = await postGetAuthorName(post);
    return (
      <p>
        {name} requested that you co-author their post <a href={link}>{post.title}</a>.
      </p>
    );
  },
});

export const PostCoauthorAcceptNotification = serverRegisterNotificationType({
  name: "coauthorAcceptNotification",
  canCombineEmails: false,
  emailSubject: async ({ user, notifications }: {user: DbUser, notifications: DbNotification[]}) => {
    let post = await Posts.findOne(notifications[0].documentId);
    if (!post) {
      throw Error(`Can't find post for notification: ${notifications[0]}`);
    }
    return `Your co-author request for '${post.title}' was accepted`;
  },
  emailBody: async ({ user, notifications }: {user: DbUser, notifications: DbNotification[]}) => {
    const post = await Posts.findOne(notifications[0].documentId);
    if (!post) {
      throw Error(`Can't find post for notification: ${notifications[0]}`);
    }
    const link = postGetPageUrl(post, true);
    return (
      <p>
        Your co-author request for <a href={link}>{post.title}</a> was accepted.
      </p>
    );
  },
});

export const NewSubforumMemberNotification = serverRegisterNotificationType({
  name: "newSubforumMember",
  canCombineEmails: false,
  emailSubject: async ({ user, notifications }: {user: DbUser, notifications: DbNotification[]}) => {
    const newUser = await Users.findOne(notifications[0].documentId)
    if (!newUser) throw new Error("Cannot find user for which this notification is being sent")
    return `New member ${newUser.displayName} has joined your subforum`;
  },
  emailBody: async ({ user, notifications }: {user: DbUser, notifications: DbNotification[]}) => {
    const newUser = await Users.findOne(notifications[0].documentId)
    const subforum = await Tags.findOne(notifications[0].extraData?.subforumId)
    if (!newUser) throw new Error(`Cannot find user for which this notification is being sent, user id: ${notifications[0].documentId}`)
    if (!subforum) throw new Error(`Cannot find subforum for which this notification is being sent, subforum id: ${notifications[0].extraData?.subforumId}`)

    return <div>
      <p>
        Hi {user.displayName},
      </p>
      <p>
        Your subforum, <a href={tagGetSubforumUrl(subforum, true)}> {subforum?.name}</a> has a new
        member: <a href={userGetProfileUrl(newUser, true)}>{newUser?.displayName}</a>.
      </p>
      <p>
        - The {forumTitleSetting.get()} Team
      </p>
    </div>
  },
});

export const NewMentionNotification = serverRegisterNotificationType({
  name: "newMention",
  emailSubject: async ({ user, notifications }: {user: DbUser, notifications: DbNotification[]}) => {
    const summary = await getDocumentSummary(notifications[0].documentType as NotificationDocument, notifications[0].documentId);
    if (!summary) {
      throw Error(`Can't find document for notification: ${notifications[0]}`);
    }
    
    return `${summary.associatedUserName} mentioned you in ${summary.displayName}`;
  },
  emailBody: async ({ user, notifications }: {user: DbUser, notifications: DbNotification[]}) => {
    const summary = await getDocumentSummary(notifications[0].documentType as NotificationDocument, notifications[0].documentId);
    if (!summary) {
      throw Error(`Can't find document for notification: ${notifications[0]}`);
    }

    if (!notifications[0].link) {
      throw Error(`Can't link for notification: ${notifications[0]}`);
    }

    return (
      <p>
        {summary.associatedUserName} mentioned you in <a href={makeAbsolute(notifications[0].link)}>{summary.displayName}</a>.
      </p>
    );
  },
});
