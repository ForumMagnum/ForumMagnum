import React from 'react';
import { makeAbsolute, getSiteUrl, combineUrls } from '../lib/vulcan-lib/utils';
import { Posts } from '../server/collections/posts/collection';
import { postGetPageUrl, postGetAuthorName, postGetEditUrl } from '../lib/collections/posts/helpers';
import { Comments } from '../server/collections/comments/collection';
import { Localgroups } from '../server/collections/localgroups/collection';
import { Messages } from '../server/collections/messages/collection';
import { TagRels } from '../server/collections/tagRels/collection';
import { Conversations } from '../server/collections/conversations/collection';
import { accessFilterMultiple } from '../lib/utils/schemaUtils';
import keyBy from 'lodash/keyBy';
import Users from '../server/collections/users/collection';
import { userGetDisplayName, userGetProfileUrl } from '../lib/collections/users/helpers';
import * as _ from 'underscore';
import { taggedPostMessage, getDocumentSummary, getDocument } from '@/lib/notificationDataHelpers';
import type { NotificationDocument } from './collections/notifications/constants';
import { commentGetPageUrlFromIds } from "../lib/collections/comments/helpers";
import { getReviewTitle, REVIEW_YEAR } from '../lib/reviewUtils';
import { ForumOptions, forumSelect } from '../lib/forumTypeUtils';
import { forumTitleSetting, siteNameWithArticleSetting } from '../lib/instanceSettings';
import Tags from '../server/collections/tags/collection';
import { tagGetSubforumUrl } from '../lib/collections/tags/helpers';
import uniq from 'lodash/uniq';
import startCase from 'lodash/startCase';
import Sequences from '../server/collections/sequences/collection';
import { DialogueMessageEmailInfo, NewDialogueMessagesEmail } from './emailComponents/NewDialogueMessagesEmail';
import { PostsEmail } from './emailComponents/PostsEmail';
import { EmailCommentBatch } from './emailComponents/EmailComment';
import { PostNominatedEmail } from './emailComponents/PostNominatedEmail';
import { SequenceNewPostsEmail } from './emailComponents/SequenceNewPostsEmail';
import { PrivateMessagesEmail } from './emailComponents/PrivateMessagesEmail';
import { EventUpdatedEmail } from './emailComponents/EventUpdatedEmail';
import { EmailUsernameByID } from './emailComponents/EmailUsernameByID';
import { EmailContextType } from './emailComponents/emailContext';

interface ServerNotificationType {
  name: string,
  from?: string,
  canCombineEmails?: boolean,
  skip: ({user, notifications}: {user: DbUser, notifications: DbNotification[]}) => Promise<boolean>,
  loadData?: ({user, notifications, context}: {user: DbUser, notifications: DbNotification[], context: ResolverContext}) => Promise<any>,
  emailSubject: ({user, notifications, context}: {user: DbUser, notifications: DbNotification[], context: ResolverContext}) => Promise<string>,
  emailBody: ({user, notifications, emailContext}: {user: DbUser, notifications: DbNotification[], emailContext: EmailContextType}) => Promise<React.ReactNode>,
}
// A default skip function is added in createServerNotificationType so it is optional when registering a notification type
type ServerRegisterNotificationType = Omit<ServerNotificationType, 'skip'> & Partial<Pick<ServerNotificationType, 'skip'>>

const createServerNotificationType = ({skip = async () => false, ...notificationTypeClass}: ServerRegisterNotificationType): ServerNotificationType => {
  const notificationType = {skip, ...notificationTypeClass};
  const name = notificationType.name;
  return notificationType;
}

export const NewPostNotification = createServerNotificationType({
  name: "newPost",
  canCombineEmails: true,
  emailSubject: async ({ user, notifications }: {user: DbUser, notifications: DbNotification[]}) => {
    const uniquePostIds = Array.from(new Set(notifications.map(n => n.documentId)));
    if (uniquePostIds.length > 1) {
      return `${uniquePostIds.length} new posts by authors you are subscribed to`;
    } else {
      const postId = uniquePostIds[0];
      const post = await Posts.findOne({_id: postId});
      if (!post) throw Error(`Can't find post to generate subject-line for: ${postId}`)
      return post.title;
    }
  },
  emailBody: async ({ user, notifications, emailContext }: {
    user: DbUser,
    notifications: DbNotification[],
    emailContext: EmailContextType,
  }) => {
    const postIds = Array.from(new Set(notifications.map(n => n.documentId).filter(postId => {
      if (!postId) {
        // eslint-disable-next-line no-console
        console.error("Can't find post to generate body for, no postId given");
        return false;
      }
      return true;
    }))) as string[];

    return <PostsEmail postIds={postIds} emailContext={emailContext}/>
  },
});

// Vulcan notification that we don't really use
export const PostApprovedNotification = createServerNotificationType({
  name: "postApproved",
  emailSubject: async ({ user, notifications }: {user: DbUser, notifications: DbNotification[]}) => {
    return "LessWrong notification";
  },
  emailBody: async ({ user, notifications }: {user: DbUser, notifications: DbNotification[]}) => null
});

export const NewEventNotification = createServerNotificationType({
  name: "newEvent",
  canCombineEmails: false,
  emailSubject: async ({ user, notifications }: {user: DbUser, notifications: DbNotification[]}) => {
    const post = await Posts.findOne(notifications[0].documentId);
    if (!post) throw Error(`Can't find post to generate subject-line for: ${notifications}`)
    return `New event: ${post.title}`;
  },
  emailBody: async ({ user, notifications, emailContext }) => {
    const postId = notifications[0].documentId;
    if (!postId) throw Error(`Can't find event post to generate body for: ${postId}`)
    
    return <PostsEmail postIds={[postId]} hideRecommendations={true} reason="you are subscribed to this group" emailContext={emailContext}/>
  },
});

export const NewGroupPostNotification = createServerNotificationType({
  name: "newGroupPost",
  canCombineEmails: false,
  emailSubject: async ({ user, notifications }: {user: DbUser, notifications: DbNotification[]}) => {
    const post = await Posts.findOne(notifications[0].documentId);
    const group = await Localgroups.findOne(post?.groupId);
    return `New post in group ${group?.name}`;
  },
  emailBody: async ({ user, notifications, emailContext }) => {
    const postId = notifications[0].documentId;
    if (!postId) throw Error(`Can't find group post to generate body for: ${postId}`)
    
    return <PostsEmail postIds={[postId]} hideRecommendations={true} reason="you are subscribed to this group" emailContext={emailContext}/>
  },
});

export const NominatedPostNotification = createServerNotificationType({
  name: "postNominated",
  canCombineEmails: false,
  emailSubject: async ({user, notifications}: {user: DbUser, notifications: DbNotification[]}) => {
    return `Your post was nominated for the ${getReviewTitle(REVIEW_YEAR)}`
  },
  emailBody: async ({user, notifications}: {user: DbUser, notifications: DbNotification[]}) => {
    const postId = notifications[0].documentId;
    if (!postId) throw Error(`Can't find nominated post to generate body for: ${postId}`)
    return <PostNominatedEmail documentId={postId} />
  }
})

export const NewShortformNotification = createServerNotificationType({
  name: "newShortform",
  canCombineEmails: true,
  emailSubject: async ({user, notifications}: {user: DbUser, notifications: DbNotification[]}) => {
    if (notifications.length > 1) {
      return `${notifications.length} new quick takes from authors you are subscribed to`;
    } else {
      const comment = await Comments.findOne(notifications[0].documentId);
      const post = comment?.postId && await Posts.findOne(comment.postId);

      if (!post) throw Error(`Can't find post to generate subject-line for: ${comment}`);

      const author = await Users.findOne(comment.userId);
      if (!author) throw Error(`Can't find author for comment: ${comment}`);

      return `New quick take by ${author.displayName}`;
    }
  },
  emailBody: async ({user, notifications, emailContext}) => {
    const commentIds = notifications.map(n => n.documentId);
    const comments = await Comments.find({_id: {$in: commentIds}}).fetch();
    if (!comments.length) throw Error(`Can't find comments for comment email notification: ${notifications}`);

    return <EmailCommentBatch comments={comments} emailContext={emailContext}/>;
  }
})

export const NewTagPostsNotification = createServerNotificationType({
  name: "newTagPosts",
  canCombineEmails: false,
  emailSubject: async ({user, notifications, context}: {user: DbUser, notifications: DbNotification[], context: ResolverContext}) => {
    const {documentId, documentType} = notifications[0]
    return await taggedPostMessage({documentId, documentType: documentType as NotificationDocument, context})
  },
  emailBody: async ({user, notifications, emailContext}) => {
    const {documentId, documentType} = notifications[0]
    const tagRel = await TagRels.findOne({_id: documentId})
    if (tagRel) {
      return <PostsEmail postIds={[tagRel.postId]} emailContext={emailContext}/>
    }
  }
})

export const NewSequencePostsNotification = createServerNotificationType({
  name: "newSequencePosts",
  canCombineEmails: false,
  emailSubject: async ({user, notifications, context}: {user: DbUser, notifications: DbNotification[], context: ResolverContext}) => {
    const sequence = await getDocument(notifications[0].documentType as NotificationDocument, notifications[0].documentId, context) as DbSequence;
    if (!sequence) throw Error(`Can't find sequence for notification: ${notifications[0]}`)
    return `Posts added to ${sequence.title}`
  },
  emailBody: async ({user, notifications, emailContext}) => {
    const {documentId, extraData} = notifications[0]
    
    const sequence = await Sequences.findOne({_id: documentId})
    if (!sequence) throw Error(`Can't find sequence for notification: ${notifications[0]}`)

    const posts = await Posts.find({
      _id: {$in: extraData.postIds},
      draft: {$ne: true},
      deletedDraft: {$ne: true},
    }).fetch()
    
    if (!posts.length) throw Error(`No valid new posts for notification: ${notifications[0]}`)
    
    return <SequenceNewPostsEmail sequence={sequence} posts={posts} emailContext={emailContext} />;
  }
})

export const NewCommentNotification = createServerNotificationType({
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
  emailBody: async ({ user, notifications, emailContext }: {user: DbUser, notifications: DbNotification[], emailContext: EmailContextType}) => {
    const commentIds = notifications.map(n => n.documentId);
    const commentsRaw = await Comments.find({_id: {$in: commentIds}}).fetch();
    const comments = await accessFilterMultiple(user, 'Comments', commentsRaw, emailContext.resolverContext);
    
    return <EmailCommentBatch comments={comments} emailContext={emailContext}/>;
  },
});

export const NewUserCommentNotification = createServerNotificationType({
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
  emailBody: async ({ user, notifications, emailContext }) => {
    const commentIds = notifications.map(n => n.documentId);
    const commentsRaw = await Comments.find({_id: {$in: commentIds}}).fetch();
    const comments = await accessFilterMultiple(user, 'Comments', commentsRaw, emailContext.resolverContext);
    
    return <EmailCommentBatch comments={comments} emailContext={emailContext}/>;
  },
});

export const NewSubforumCommentNotification = createServerNotificationType({
  name: "newSubforumComment",
  canCombineEmails: true,
  skip: async ({ user, notifications, context }: {user: DbUser, notifications: DbNotification[], context: ResolverContext}) => {
    const commentIds = notifications.map(n => n.documentId);
    const commentsRaw = await Comments.find({_id: {$in: commentIds}}).fetch();
    const comments = await accessFilterMultiple(user, 'Comments', commentsRaw, context);

    return comments.length === 0;
  },
  emailSubject: async ({ user, notifications, context }: {user: DbUser, notifications: DbNotification[], context: ResolverContext}) => {
    const commentIds = notifications.map(n => n.documentId);
    const commentsRaw = await Comments.find({_id: {$in: commentIds}}).fetch();
    const comments = await accessFilterMultiple(user, 'Comments', commentsRaw, context);

    const commentCount = comments.length
    const subforumIds = uniq(comments.map(c => c.tagId))

    if (subforumIds.length === 1) {
      const subforum = await Tags.findOne(subforumIds[0])
      return `${commentCount} new comment${commentCount > 1 ? 's' : ''} in the ${startCase(subforum?.name)} topic`
    } else {
      return `${commentCount} new comment${commentCount > 1 ? 's' : ''} in ${subforumIds.length} topics you are subscribed to`
    }
  },
  emailBody: async ({ user, notifications, emailContext }) => {
    const commentIds = notifications.map(n => n.documentId);
    const commentsRaw = await Comments.find({_id: {$in: commentIds}}).fetch();
    const comments = await accessFilterMultiple(user, 'Comments', commentsRaw, emailContext.resolverContext);
    
    return <EmailCommentBatch comments={comments} emailContext={emailContext}/>;
  },
});

export const NewDialogueMessageNotification = createServerNotificationType({
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
    return <NewDialogueMessagesEmail documentId={postId} userId={user._id} dialogueMessageEmailInfo={dialogueMessageEmailInfo}/>;
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

export const NewDialogueMessageBatchNotification = createServerNotificationType({
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
    return <NewDialogueMessagesEmail documentId={postId} userId={user._id}/>;
  },
});

//subscriber notification for dialogues
export const NewPublishedDialogueMessageNotification = createServerNotificationType({
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
    return <NewDialogueMessagesEmail documentId={postId} userId={user._id}/>;
  },
});

export const NewDebateCommentNotification = createServerNotificationType({
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
  emailBody: async ({ user, notifications, emailContext }) => {
    const commentIds = notifications.map(n => n.documentId);
    const commentsRaw = await Comments.find({_id: {$in: commentIds}}).fetch();
    const comments = await accessFilterMultiple(user, 'Comments', commentsRaw, emailContext.resolverContext);
    
    return <EmailCommentBatch comments={comments} emailContext={emailContext}/>;
  },
});

export const NewDebateReplyNotification = createServerNotificationType({
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
  emailBody: async ({ user, notifications, emailContext }) => {
    const commentIds = notifications.map(n => n.documentId);
    const commentsRaw = await Comments.find({_id: {$in: commentIds}}).fetch();
    const comments = await accessFilterMultiple(user, 'Comments', commentsRaw, emailContext.resolverContext);
    
    return <EmailCommentBatch comments={comments} emailContext={emailContext}/>;
  },
});

export const NewReplyNotification = createServerNotificationType({
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
  emailBody: async ({ user, notifications, emailContext }) => {
    const commentIds = notifications.map(n => n.documentId);
    const commentsRaw = await Comments.find({_id: {$in: commentIds}}).fetch();
    const comments = await accessFilterMultiple(user, 'Comments', commentsRaw, emailContext.resolverContext);
    
    return <EmailCommentBatch comments={comments} emailContext={emailContext}/>;
  },
});

export const NewReplyToYouNotification = createServerNotificationType({
  name: "newReplyToYou",
  canCombineEmails: true,
  emailSubject: async ({ user, notifications }: {user: DbUser, notifications: DbNotification[]}) => {
    const anyIndirect = notifications.some(n => n.extraData?.direct === false);

    if (notifications.length > 1) {
      return anyIndirect ? `${notifications.length} replies to threads you participated in` : `${notifications.length} replies to your comments`;
    } else {
      const comment = await Comments.findOne(notifications[0].documentId);
      if (!comment) throw Error(`Can't find comment for notification: ${notifications[0]}`)
      const author = await Users.findOne(comment.userId);
      if (!author) throw Error(`Can't find author for new comment notification: ${notifications[0]}`)
      return anyIndirect ? `${userGetDisplayName(author)} replied to a thread you participated in` : `${userGetDisplayName(author)} replied to your comment`;
    }
  },
  emailBody: async ({ user, notifications, emailContext }) => {
    const commentIds = notifications.map(n => n.documentId);
    const commentsRaw = await Comments.find({_id: {$in: commentIds}}).fetch();
    const comments = await accessFilterMultiple(user, 'Comments', commentsRaw, emailContext.resolverContext);
    
    return <EmailCommentBatch comments={comments} emailContext={emailContext}/>;
  },
});

// Vulcan notification that we don't really use
export const NewUserNotification = createServerNotificationType({
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

export const NewMessageNotification = createServerNotificationType({
  name: "newMessage",
  from: forumNewMessageEmail, // passing in undefined will lead to default behavior
  loadData: async function({ user, notifications, context }) {
    // Load messages
    const messageIds = notifications.map(notification => notification.documentId);
    const messagesRaw = await Messages.find({ _id: {$in: messageIds} }).fetch();
    const messages = await accessFilterMultiple(user, 'Messages', messagesRaw, context);
    
    // Load conversations
    const messagesByConversationId = keyBy(messages, message=>message.conversationId);
    const conversationIds = _.keys(messagesByConversationId);
    const conversationsRaw = await Conversations.find({ _id: {$in: conversationIds} }).fetch();
    const conversations = await accessFilterMultiple(user, 'Conversations', conversationsRaw, context);
    
    // Load participant users
    const participantIds = _.uniq(_.flatten(conversations.map(conversation => conversation.participantIds), true));
    const participantsRaw = await Users.find({ _id: {$in: participantIds} }).fetch();
    const participants = await accessFilterMultiple(user, 'Users', participantsRaw, context);
    const participantsById = keyBy(participants, u=>u._id);
    const otherParticipants = _.filter(participants, participant=>participant._id!==user._id);
    
    return { conversations, messages, participantsById, otherParticipants };
  },
  emailSubject: async function({ user, notifications, context }: {user: DbUser, notifications: DbNotification[], context: ResolverContext}) {
    const { conversations, otherParticipants } = await this.loadData!({ user, notifications, context });
    
    const otherParticipantNames = otherParticipants.map((u: DbUser)=>userGetDisplayName(u)).join(', ');
    
    return `Private message conversation${conversations.length>1 ? 's' : ''} with ${otherParticipantNames}`;
  },
  emailBody: async function({ user, notifications, emailContext }) {
    const { conversations, messages, participantsById } = await this.loadData!({ user, notifications, context: emailContext.resolverContext });
    
    return <PrivateMessagesEmail
      conversations={conversations}
      messages={messages}
      participantsById={participantsById}
      emailContext={emailContext}
    />
  },
});

export const WrappedNotification = createServerNotificationType({
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
export const EmailVerificationRequiredNotification = createServerNotificationType({
  name: "emailVerificationRequired",
  canCombineEmails: false,
  emailSubject: async ({ user, notifications }: {user: DbUser, notifications: DbNotification[]}) => {
    throw new Error("emailVerificationRequired notification should never be emailed");
  },
  emailBody: async ({ user, notifications }: {user: DbUser, notifications: DbNotification[]}) => {
    throw new Error("emailVerificationRequired notification should never be emailed");
  },
});

export const PostSharedWithUserNotification = createServerNotificationType({
  name: "postSharedWithUser",
  canCombineEmails: false,
  emailSubject: async ({ user, notifications, context }: {user: DbUser, notifications: DbNotification[], context: ResolverContext}) => {
    let post = await Posts.findOne(notifications[0].documentId);
    if (!post) throw Error(`Can't find post for notification: ${notifications[0]}`)
    const name = await postGetAuthorName(post, context);
    return `${name} shared their ${post.draft ? "draft" : "post"} "${post.title}" with you`;
  },
  emailBody: async ({ user, notifications, emailContext }) => {
    const post = await Posts.findOne(notifications[0].documentId);
    if (!post) throw Error(`Can't find post for notification: ${notifications[0]}`)
    const link = postGetPageUrl(post, true);
    const name = await postGetAuthorName(post, emailContext.resolverContext);
    return <p>
      {name} shared their {post.draft ? "draft" : "post"} <a href={link}>{post.title}</a> with you.
    </p>
  },
});

export const PostAddedAsCoauthorNotification = createServerNotificationType({
  name: "addedAsCoauthor",
  canCombineEmails: false,
  emailSubject: async ({ user, notifications, context }: {user: DbUser, notifications: DbNotification[], context: ResolverContext}) => {
    let post = await Posts.findOne(notifications[0].documentId);
    if (!post) throw Error(`Can't find post for notification: ${notifications[0]}`)
    const name = await postGetAuthorName(post, context);
    const postOrDialogue = post.collabEditorDialogue ? 'dialogue' : 'post';
    return `${name} added you as a coauthor to the ${postOrDialogue} "${post.title}"`;
  },
  emailBody: async ({ user, notifications, emailContext }) => {
    const post = await Posts.findOne(notifications[0].documentId);
    if (!post) throw Error(`Can't find post for notification: ${notifications[0]}`)
    const link = postGetEditUrl(post._id, true);
    const name = await postGetAuthorName(post, emailContext.resolverContext);
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

export const AlignmentSubmissionApprovalNotification = createServerNotificationType({
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

export const NewEventInRadiusNotification = createServerNotificationType({
  name: "newEventInRadius",
  canCombineEmails: false,
  emailSubject: async ({ user, notifications }: {user: DbUser, notifications: DbNotification[]}) => {
    let post = await Posts.findOne(notifications[0].documentId);
    if (!post) throw Error(`Can't find post for notification: ${notifications[0]}`)
    return `New event in your area: ${post.title}`;
  },
  emailBody: async ({ user, notifications, emailContext }) => {
    const postId = notifications[0].documentId;
    if (!postId) throw Error(`Can't find event to generate body for: ${postId}`)
    
    return <PostsEmail postIds={[postId]} hideRecommendations={true} reason="you are subscribed to nearby events notifications" emailContext={emailContext}/>
  },
});

export const EditedEventInRadiusNotification = createServerNotificationType({
  name: "editedEventInRadius",
  canCombineEmails: false,
  emailSubject: async ({ user, notifications }: {user: DbUser, notifications: DbNotification[]}) => {
    let post = await Posts.findOne(notifications[0].documentId);
    if (!post) throw Error(`Can't find post for notification: ${notifications[0]}`)
    return `Event in your area updated: ${post.title}`;
  },
  emailBody: async ({ user, notifications, emailContext }) => {
    const postId= notifications[0].documentId
    if (!postId) throw Error(`Can't find event to generate body for: ${postId}`)
    return <EventUpdatedEmail postId={postId} emailContext={emailContext} />
  },
});


export const NewRSVPNotification = createServerNotificationType({
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

export const KarmaPowersGainedNotification = createServerNotificationType({
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

export const NewGroupOrganizerNotification = createServerNotificationType({
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

export const NewCommentOnDraftNotification = createServerNotificationType({
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

export const PostCoauthorRequestNotification = createServerNotificationType({
  name: "coauthorRequestNotification",
  canCombineEmails: false,
  emailSubject: async ({ user, notifications, context }: {user: DbUser, notifications: DbNotification[], context: ResolverContext}) => {
    let post = await Posts.findOne(notifications[0].documentId);
    if (!post) {
      throw Error(`Can't find post for notification: ${notifications[0]}`);
    }
    const name = await postGetAuthorName(post, context);
    return `${name} requested that you co-author their post: ${post.title}`;
  },
  emailBody: async ({ user, notifications, emailContext }) => {
    const post = await Posts.findOne(notifications[0].documentId);
    if (!post) {
      throw Error(`Can't find post for notification: ${notifications[0]}`);
    }
    const link = postGetPageUrl(post, true);
    const name = await postGetAuthorName(post, emailContext.resolverContext);
    return (
      <p>
        {name} requested that you co-author their post <a href={link}>{post.title}</a>.
      </p>
    );
  },
});

export const PostCoauthorAcceptNotification = createServerNotificationType({
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

export const NewSubforumMemberNotification = createServerNotificationType({
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

export const NewMentionNotification = createServerNotificationType({
  name: "newMention",
  emailSubject: async ({ user, notifications, context }: {user: DbUser, notifications: DbNotification[], context: ResolverContext}) => {
    const summary = await getDocumentSummary(notifications[0].documentType as NotificationDocument, notifications[0].documentId, context);
    if (!summary) {
      throw Error(`Can't find document for notification: ${notifications[0]}`);
    }
    
    return `${summary.associatedUserName} mentioned you in ${summary.displayName}`;
  },
  emailBody: async ({ user, notifications, emailContext }) => {
    const notification = notifications[0];
    const summary = await getDocumentSummary(notification.documentType as NotificationDocument, notification.documentId, emailContext.resolverContext);
    if (!summary) {
      throw Error(`Can't find document for notification: ${notification}`);
    }

    if (!notification.link) {
      throw Error(`Can't link for notification: ${notification}`);
    }

    return (
      <p>
        {summary.associatedUserName} mentioned you in <a href={makeAbsolute(notification.link)}>{summary.displayName}</a>.
      </p>
    );
  },
});

const serverNotificationTypesArray: ServerNotificationType[] = [
  NewPostNotification,
  PostApprovedNotification,
  NewEventNotification,
  NewGroupPostNotification,
  NominatedPostNotification,
  NewShortformNotification,
  NewTagPostsNotification,
  NewSequencePostsNotification,
  NewCommentNotification,
  NewUserCommentNotification,
  NewSubforumCommentNotification,
  NewDialogueMessageNotification,
  NewDialogueMessageBatchNotification,
  NewPublishedDialogueMessageNotification,
  NewDebateCommentNotification,
  NewDebateReplyNotification,
  NewReplyNotification,
  NewReplyToYouNotification,
  NewUserNotification,
  NewMessageNotification,
  WrappedNotification,
  EmailVerificationRequiredNotification,
  PostSharedWithUserNotification,
  PostAddedAsCoauthorNotification,
  AlignmentSubmissionApprovalNotification,
  NewEventInRadiusNotification,
  EditedEventInRadiusNotification,
  NewRSVPNotification,
  KarmaPowersGainedNotification,
  NewGroupOrganizerNotification,
  NewCommentOnDraftNotification,
  PostCoauthorRequestNotification,
  PostCoauthorAcceptNotification,
  NewSubforumMemberNotification,
  NewMentionNotification,
];
const serverNotificationTypes: Record<string,ServerNotificationType> = keyBy(serverNotificationTypesArray, n=>n.name);


export const getNotificationTypeByNameServer = (name: string): ServerNotificationType => {
  if (name in serverNotificationTypes)
    return serverNotificationTypes[name];
  else
    throw new Error(`Invalid notification type: ${name}`);
}
