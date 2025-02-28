import Notifications from '../lib/collections/notifications/collection';
import Conversations from '../lib/collections/conversations/collection';
import Users from '../lib/collections/users/collection';
import { Posts } from '../lib/collections/posts/collection';
import { getConfirmedCoauthorIds } from '../lib/collections/posts/helpers';
import './emailComponents/EmailWrapper';
import './emailComponents/NewPostEmail';
import './emailComponents/PostNominatedEmail';
import './emailComponents/PrivateMessagesEmail';
import './emailComponents/EmailCuratedAuthors';
import * as _ from 'underscore';
import { getCollectionHooks } from './mutationCallbacks';

import { RSVPType } from '../lib/collections/posts/schema';
import { createNotifications } from './notificationCallbacksHelpers'
import moment from 'moment';
import difference from 'lodash/difference';
import Messages from '../lib/collections/messages/collection';
import { REVIEW_AND_VOTING_PHASE_VOTECOUNT_THRESHOLD } from '../lib/reviewUtils';
import { DialogueMessageInfo } from '../components/posts/PostsPreviewTooltip/PostsPreviewTooltip';


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
