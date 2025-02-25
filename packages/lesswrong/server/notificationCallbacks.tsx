import Notifications from '../lib/collections/notifications/collection';
import Conversations from '../lib/collections/conversations/collection';
import { subscriptionTypes } from '../lib/collections/subscriptions/schema';
import Localgroups from '../lib/collections/localgroups/collection';
import Users from '../lib/collections/users/collection';
import { Posts } from '../lib/collections/posts/collection';
import { getConfirmedCoauthorIds, postGetPageUrl, postIsPublic } from '../lib/collections/posts/helpers';
import { wrapAndSendEmail } from './emails/renderEmail';
import './emailComponents/EmailWrapper';
import './emailComponents/NewPostEmail';
import './emailComponents/PostNominatedEmail';
import './emailComponents/PrivateMessagesEmail';
import './emailComponents/EmailCuratedAuthors';
import * as _ from 'underscore';
import { Components } from '../lib/vulcan-lib/components';
import { getCollectionHooks } from './mutationCallbacks';

import React from 'react';
import { RSVPType } from '../lib/collections/posts/schema';
import { getSubscribedUsers, createNotifications } from './notificationCallbacksHelpers'
import moment from 'moment';
import difference from 'lodash/difference';
import Messages from '../lib/collections/messages/collection';
import Tags from '../lib/collections/tags/collection';
import { subforumGetSubscribedUsers } from '../lib/collections/tags/helpers';
import UserTagRels from '../lib/collections/userTagRels/collection';
import { REVIEW_AND_VOTING_PHASE_VOTECOUNT_THRESHOLD } from '../lib/reviewUtils';
import { commentIsHidden } from '../lib/collections/comments/helpers';
import { DialogueMessageInfo } from '../components/posts/PostsPreviewTooltip/PostsPreviewTooltip';
import { filterNonnull } from '../lib/utils/typeGuardUtils';
import CommentsRepo from './repos/CommentsRepo';
import uniq from 'lodash/uniq';
import { DatabaseServerSetting } from './databaseSettings';
import { forumSelect } from '@/lib/forumTypeUtils';

const commentAncestorsToNotifySetting = new DatabaseServerSetting<number>('commentAncestorsToNotifySetting', forumSelect({EAForum: 5, default: 1}));

interface NotifyDialogueParticipantProps {
  participant: DbUser,
  post: DbPost,
  previousNotifications: DbNotification[],
  newMessageAuthorId: string,
  dialogueMessageInfo: DialogueMessageInfo|undefined,
}

async function sendSingleDialogueMessageNotification(props: Omit<NotifyDialogueParticipantProps, "previousNotifications">) {
  const { participant, post, newMessageAuthorId, dialogueMessageInfo } = props
  return await createNotifications({ 
    userIds: [participant._id], 
    notificationType: 'newDialogueMessages', 
    documentType: 'post', 
    documentId: post._id, 
    extraData: {newMessageAuthorId, dialogueMessageInfo} 
  })
}

async function sendBatchDialogueMessageNotification(props: Pick<NotifyDialogueParticipantProps, "participant"|"post">) {
  const { participant, post } = props
  return await createNotifications({ 
    userIds: [participant._id], 
    notificationType: 'newDialogueBatchMessages', 
    documentType: 'post', 
    documentId: post._id, 
  })
}

async function notifyDialogueParticipantNewMessage(props: NotifyDialogueParticipantProps) {
  const { participant, previousNotifications } = props
  const lastNotificationCheckedAt = participant.lastNotificationsCheck;
  const mostRecentNotification = previousNotifications[0]

  //no previous dialogue notifications, send notification with individual message preview
  if (!mostRecentNotification) {
    return await sendSingleDialogueMessageNotification(props)
  }

  const isLastNotificationUnread = moment(mostRecentNotification.createdAt).isAfter(lastNotificationCheckedAt)

  //most recent notification is a batch notifcation
  if (mostRecentNotification.type === 'newDialogueBatchMessages') {
    //if unread, don't send another
    if (isLastNotificationUnread) return
    //if read, go back to sending individual message preview
    return await sendSingleDialogueMessageNotification(props)
  //most recent notification is an individual message preview
  } else {
    //if unread, send batch notification
    if (isLastNotificationUnread) {
      return await sendBatchDialogueMessageNotification(props)
    }
    //if read, send another individual message preview
    return await sendSingleDialogueMessageNotification(props)
  }
}

export async function notifyDialogueParticipantsNewMessage(newMessageAuthorId: string, dialogueMessageInfo: DialogueMessageInfo|undefined, post: DbPost) {
  // Get all the debate participants, but exclude the comment author if they're a debate participant
  const debateParticipantIds = _.difference([post.userId, ...getConfirmedCoauthorIds(post)], [newMessageAuthorId]);
  const debateParticipants = await Users.find({_id: {$in: debateParticipantIds}}).fetch();
  const earliestLastNotificationsCheck = _.min(debateParticipants.map(user => user.lastNotificationsCheck));

  const notifications = await Notifications.find({
    userId: {$in: debateParticipantIds}, 
    documentId: post._id,
    documentType: 'post', 
    type: {$in: ['newDialogueMessages', 'newDialogueBatchMessages']}, 
    createdAt: {$gt: earliestLastNotificationsCheck}
  }, {sort: {createdAt: -1}}).fetch();


  const notificationsByUserId = _.groupBy(notifications, notification => notification.userId);
  debateParticipantIds.forEach(userId => {
    if (!notificationsByUserId[userId]) {
      notificationsByUserId[userId] = []
    }
  })
  const notificationPromises = Object.entries(notificationsByUserId).map(async ([userId, previousNotifications]) => {
    const participant = debateParticipants.find(user => user._id === userId)
    if (participant) {
      return notifyDialogueParticipantNewMessage({participant, post, previousNotifications, newMessageAuthorId, dialogueMessageInfo})
    }
  })

  await Promise.all(notificationPromises)
}

getCollectionHooks("TagRels").newAsync.add(async function TaggedPostNewNotifications(tagRel: DbTagRel) {
  const subscribedUsers = await getSubscribedUsers({
    documentId: tagRel.tagId,
    collectionName: "Tags",
    type: subscriptionTypes.newTagPosts
  })
  const post = await Posts.findOne({_id:tagRel.postId})
  if (post && postIsPublic(post) && !post.authorIsUnreviewed) {
    const subscribedUserIds = _.map(subscribedUsers, u=>u._id);
    
    // Don't notify the person who created the tagRel
    let tagSubscriberIdsToNotify = _.difference(subscribedUserIds, filterNonnull([tagRel.userId]))

    //eslint-disable-next-line no-console
    console.info("Post tagged, creating notifications");
    await createNotifications({userIds: tagSubscriberIdsToNotify, notificationType: 'newTagPosts', documentType: 'tagRel', documentId: tagRel._id});
  }
});

async function getEmailFromRsvp({email, userId}: RSVPType): Promise<string | undefined> {
  if (email) {
    // Email is free text
    // eslint-disable-next-line
    const matches = email.match(/(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))/)
    const foundEmail = matches?.[0]
    if (foundEmail) {
      return foundEmail
    }
  }
  if (userId) {
    const user = await Users.findOne(userId)
    if (user) {
      return user.email ?? undefined
    }
  }
}


export async function getUsersToNotifyAboutEvent(post: DbPost): Promise<{rsvp: RSVPType, userId: string|null, email: string|undefined}[]> {
  if (!post.rsvps || !post.rsvps.length) {
    return [];
  }
  
  return await Promise.all(post.rsvps
    .filter(r => r.response !== "no")
    .map(async (r: RSVPType) => ({
      rsvp: r,
      userId: r.userId,
      email: await getEmailFromRsvp(r),
    }))
  );
}

async function notifyRsvps(comment: DbComment, post: DbPost) {
  if (!post.rsvps || !post.rsvps.length) {
    return;
  }
  
  const emailsToNotify = await getUsersToNotifyAboutEvent(post);
  
  const postLink = postGetPageUrl(post, true);
  
  for (let {userId,email} of emailsToNotify) {
    if (!email) continue;
    const user = await Users.findOne(userId);
    
    await wrapAndSendEmail({
      user: user,
      to: email,
      subject: `New comment on ${post.title}`,
      body: <Components.EmailComment commentId={comment._id}/>,
    });
  }
}

// This may have been sending out duplicate notifications in previous years, maybe just be because this was implemented partway into the review, and some posts slipped through that hadn't previously gotten voted on.
getCollectionHooks("ReviewVotes").newAsync.add(async function PositiveReviewVoteNotifications(reviewVote: DbReviewVote) {
  const post = reviewVote.postId ? await Posts.findOne(reviewVote.postId) : null;
  if (post && post.positiveReviewVoteCount >= REVIEW_AND_VOTING_PHASE_VOTECOUNT_THRESHOLD) {
    const notifications = await Notifications.find({documentId:post._id, type: "postNominated" }).fetch()
    if (!notifications.length) {
      await createNotifications({userIds: [post.userId], notificationType: "postNominated", documentType: "post", documentId: post._id})
    }
  }
})

const sendNewCommentNotifications = async (comment: DbComment) => {
  const post = comment.postId ? await Posts.findOne(comment.postId) : null;
  
  if (comment.legacyData?.arbitalPageId) return;
  
  if (post?.isEvent) {
    await notifyRsvps(comment, post);
  }

  // keep track of whom we've notified (so that we don't notify the same user twice for one comment,
  // if e.g. they're both the author of the post and the author of a comment being replied to)
  let notifiedUsers: Array<string> = [];



  // 1. Notify users who are subscribed to the parent comment
  if (comment.parentCommentId) {

    const parentComments: { commentId: string; userId: string }[] = await new CommentsRepo().getParentCommentIds({
      commentId: comment._id,
      limit: commentAncestorsToNotifySetting.get(),
    });

    let newReplyUserIds: string[] = [];
    let newReplyToYouUserIds: string[] = [];

    for (const {commentId, userId} of parentComments) {
      const subscribedUsers = await getSubscribedUsers({
        documentId: commentId,
        collectionName: "Comments",
        type: subscriptionTypes.newReplies,
        potentiallyDefaultSubscribedUserIds: [userId],
        userIsDefaultSubscribed: u => u.auto_subscribe_to_my_comments
      })
      const subscribedUserIds = _.map(subscribedUsers, u=>u._id);

      // Don't notify the author of their own comment, and filter out the author
      // of the parent-comment to be treated specially (with a newReplyToYou
      // notification instead of a newReply notification).
      newReplyUserIds = [...newReplyUserIds, ..._.difference(subscribedUserIds, [comment.userId, commentId])]

      // Separately notify authors of replies to their own comments
      if (subscribedUserIds.includes(userId) && userId !== comment.userId) {
        newReplyToYouUserIds = [...newReplyToYouUserIds, ...subscribedUserIds]
      }
    }

    // Take the difference as a precaution to prevent double-notifying
    newReplyUserIds = uniq(_.difference(newReplyUserIds, newReplyToYouUserIds));
    newReplyToYouUserIds = uniq(newReplyToYouUserIds);

    await Promise.all([
      createNotifications({userIds: newReplyUserIds, notificationType: 'newReply', documentType: 'comment', documentId: comment._id}),
      createNotifications({userIds: newReplyToYouUserIds, notificationType: 'newReplyToYou', documentType: 'comment', documentId: comment._id})
    ]);

    notifiedUsers = [...notifiedUsers, ...newReplyUserIds, ...newReplyToYouUserIds];
  }

  // 2. If this comment is a debate comment, notify users who are subscribed to the post as a debate (`newDebateComments`)
  if (post && comment.debateResponse) {
    // Get all the debate participants, but exclude the comment author if they're a debate participant
    const debateParticipantIds = _.difference([post.userId, ...(post.coauthorStatuses ?? []).map(coauthor => coauthor.userId)], [comment.userId]);

    const debateSubscribers = await getSubscribedUsers({
      documentId: comment.postId,
      collectionName: "Posts",
      type: subscriptionTypes.newDebateComments,
      potentiallyDefaultSubscribedUserIds: debateParticipantIds
    });

    const debateSubscriberIds = debateSubscribers.map(sub => sub._id);
    // Handle debate readers
    // Filter out debate participants, since they get a different notification type
    // (We shouldn't have notified any users for these comments previously, but leaving that in for sanity)
    const debateSubscriberIdsToNotify = _.difference(debateSubscriberIds, [...debateParticipantIds, ...notifiedUsers, comment.userId]);
    await createNotifications({ userIds: debateSubscriberIdsToNotify, notificationType: 'newDebateComment', documentType: 'comment', documentId: comment._id });

    // Handle debate participants
    const subscribedParticipantIds = _.intersection(debateSubscriberIds, debateParticipantIds);
    await createNotifications({ userIds: subscribedParticipantIds, notificationType: 'newDebateReply', documentType: 'comment', documentId: comment._id });

    // Avoid notifying users who are subscribed to both the debate comments and regular comments on a debate twice 
    notifiedUsers = [...notifiedUsers, ...debateSubscriberIdsToNotify, ...subscribedParticipantIds];
  }
  
  // 3. Notify users who are subscribed to the post (which may or may not include the post's author)
  let userIdsSubscribedToPost: Array<string> = [];
  const usersSubscribedToPost = await getSubscribedUsers({
    documentId: comment.postId,
    collectionName: "Posts",
    type: subscriptionTypes.newComments,
    potentiallyDefaultSubscribedUserIds: post ? [post.userId, ...getConfirmedCoauthorIds(post)] : [],
    userIsDefaultSubscribed: u => u.auto_subscribe_to_my_posts
  })
  userIdsSubscribedToPost = _.map(usersSubscribedToPost, u=>u._id);
  
  // if the post is associated with a group, also (potentially) notify the group organizers
  if (post && post.groupId) {
    const group = await Localgroups.findOne(post.groupId)
    if (group?.organizerIds && group.organizerIds.length) {
      const subsWithOrganizers = await getSubscribedUsers({
        documentId: comment.postId,
        collectionName: "Posts",
        type: subscriptionTypes.newComments,
        potentiallyDefaultSubscribedUserIds: group.organizerIds,
        userIsDefaultSubscribed: u => u.autoSubscribeAsOrganizer
      })
      userIdsSubscribedToPost = _.union(userIdsSubscribedToPost, _.map(subsWithOrganizers, u=>u._id))
    }
  }

  // Notify users who are subscribed to shortform posts
  if (!comment.topLevelCommentId && comment.shortform) {
    const usersSubscribedToShortform = await getSubscribedUsers({
      documentId: comment.postId,
      collectionName: "Posts",
      type: subscriptionTypes.newShortform
    })
    const userIdsSubscribedToShortform = _.map(usersSubscribedToShortform, u=>u._id);
    await createNotifications({userIds: userIdsSubscribedToShortform, notificationType: 'newShortform', documentType: 'comment', documentId: comment._id});
    notifiedUsers = [ ...userIdsSubscribedToShortform, ...notifiedUsers]
  }
  
  // remove userIds of users that have already been notified
  // and of comment author (they could be replying in a thread they're subscribed to)
  const postSubscriberIdsToNotify = _.difference(userIdsSubscribedToPost, [...notifiedUsers, comment.userId])
  if (postSubscriberIdsToNotify.length > 0) {
    await createNotifications({userIds: postSubscriberIdsToNotify, notificationType: 'newComment', documentType: 'comment', documentId: comment._id})
    notifiedUsers = [ ...notifiedUsers, ...postSubscriberIdsToNotify]
  }
  
  // 4. If this comment is in a subforum, notify members with email notifications enabled
  if (
    comment.tagId &&
    comment.tagCommentType === "SUBFORUM" &&
    !comment.topLevelCommentId &&
    !comment.authorIsUnreviewed // FIXME: make this more general, and possibly queue up notifications from unreviewed users to send once they are approved
  ) {
    const subforumSubscriberIds = (await subforumGetSubscribedUsers({ tagId: comment.tagId })).map((u) => u._id);
    const subforumSubscriberIdsMaybeNotify = (
      await UserTagRels.find({
        userId: { $in: subforumSubscriberIds },
        tagId: comment.tagId,
        subforumEmailNotifications: true,
      }).fetch()
    ).map((u) => u.userId);
    const subforumSubscriberIdsToNotify = _.difference(subforumSubscriberIdsMaybeNotify, [...notifiedUsers, comment.userId])

    await createNotifications({
      userIds: subforumSubscriberIdsToNotify,
      notificationType: "newSubforumComment",
      documentType: "comment",
      documentId: comment._id,
    });
  }

  // 5. Notify users who are subscribed to comments by the comment author
  const commentAuthorSubscribers = await getSubscribedUsers({
    documentId: comment.userId,
    collectionName: "Users",
    type: subscriptionTypes.newUserComments
  })
  const commentAuthorSubscriberIds = commentAuthorSubscribers.map(({ _id }) => _id)
  const commentAuthorSubscriberIdsToNotify = _.difference(commentAuthorSubscriberIds, notifiedUsers)
  await createNotifications({
    userIds: commentAuthorSubscriberIdsToNotify, 
    notificationType: 'newUserComment', 
    documentType: 'comment', 
    documentId: comment._id
  });
}

// add new comment notification callback on comment submit
getCollectionHooks("Comments").newAsync.add(async function commentsNewNotifications(comment: DbComment) {
  // if the site is currently hiding comments by unreviewed authors, do not send notifications if this comment should be hidden
  if (commentIsHidden(comment)) return
  
  void sendNewCommentNotifications(comment)
});

getCollectionHooks("Comments").editAsync.add(async function commentsPublishedNotifications(comment: DbComment, oldComment: DbComment) {
  // if the site is currently hiding comments by unreviewed authors, send the proper "new comment" notifications once the comment author is reviewed
  if (commentIsHidden(oldComment) && !commentIsHidden(comment)) {
    void sendNewCommentNotifications(comment)
  }
});

getCollectionHooks("Messages").newAsync.add(async function messageNewNotification(message: DbMessage) {
  const conversationId = message.conversationId;
  const conversation = await Conversations.findOne(conversationId);
  if (!conversation) throw Error(`Can't find conversation for message: ${message}`)
  
  // For on-site notifications, notify everyone except the sender of the
  // message. For email notifications, notify everyone including the sender
  // (since if there's a back-and-forth in the grouped notifications, you want
  // to see your own messages.)
  const recipientIds = conversation.participantIds.filter((id) => (id !== message.userId));

  // Create notification
  await createNotifications({userIds: recipientIds, notificationType: 'newMessage', documentType: 'message', documentId: message._id, noEmail: message.noEmail});
});

getCollectionHooks("Conversations").editAsync.add(async function conversationEditNotification(
  conversation: DbConversation,
  oldConversation: DbConversation,
  currentUser: DbUser | null,
) {
  // Filter out the new participant if the user added themselves (which can
  // happen with mods)
  const newParticipantIds = difference(
    conversation.participantIds || [],
    oldConversation.participantIds || [],
  ).filter((id) => id !== currentUser?._id);

  if (newParticipantIds.length) {
    // Notify newly added users of the most recent message
    const mostRecentMessage = await Messages.findOne({conversationId: conversation._id}, {sort: {createdAt: -1}});
    if (mostRecentMessage) // don't notify if there are no messages, they will still be notified when they receive the first message
      await createNotifications({userIds: newParticipantIds, notificationType: 'newMessage', documentType: 'message', documentId: mostRecentMessage._id, noEmail: mostRecentMessage.noEmail});
  }
});

export async function bellNotifyEmailVerificationRequired (user: DbUser) {
  await createNotifications({userIds: [user._id], notificationType: 'emailVerificationRequired', documentType: null, documentId: null});
}


// TODO: dedupe this with the one postCallbackFunctions
const AlignmentSubmissionApprovalNotifyUser = async (newDocument: DbPost|DbComment, oldDocument: DbPost|DbComment) => {
  const newlyAF = newDocument.af && !oldDocument.af
  const userSubmitted = oldDocument.suggestForAlignmentUserIds && oldDocument.suggestForAlignmentUserIds.includes(oldDocument.userId)
  const reviewed = !!newDocument.reviewForAlignmentUserId
  
  const documentType =  newDocument.hasOwnProperty("answer") ? 'comment' : 'post'
  
  if (newlyAF && userSubmitted && reviewed) {
    await createNotifications({userIds: [newDocument.userId], notificationType: "alignmentSubmissionApproved", documentType, documentId: newDocument._id})
  }
}

getCollectionHooks("Comments").editAsync.add(AlignmentSubmissionApprovalNotifyUser)

async function newSubforumMemberNotifyMods (user: DbUser, oldUser: DbUser) {
  const newSubforumIds = difference(user.profileTagIds, oldUser.profileTagIds)
  for (const subforumId of newSubforumIds) {
    const subforum = await Tags.findOne(subforumId)
    if (subforum?.isSubforum) {
      const modIds = subforum.subforumModeratorIds || []
      await createNotifications({
        userIds: modIds,
        notificationType: 'newSubforumMember',
        documentType: 'user',
        documentId: user._id,
        extraData: {subforumId}
      })
    }
  }
}

getCollectionHooks("Users").editAsync.add(newSubforumMemberNotifyMods)
