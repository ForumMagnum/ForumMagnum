import Notifications from '../lib/collections/notifications/collection';
import Conversations from '../lib/collections/conversations/collection';
import { subscriptionTypes } from '../lib/collections/subscriptions/schema';
import Localgroups from '../lib/collections/localgroups/collection';
import Users from '../lib/collections/users/collection';
import { Posts } from '../lib/collections/posts';
import { postStatuses } from '../lib/collections/posts/constants';
import { getConfirmedCoauthorIds, postGetPageUrl, postIsApproved } from '../lib/collections/posts/helpers';
import { Comments } from '../lib/collections/comments/collection'
import { reasonUserCantReceiveEmails, wrapAndSendEmail } from './emails/renderEmail';
import './emailComponents/EmailWrapper';
import './emailComponents/NewPostEmail';
import './emailComponents/PostNominatedEmail';
import './emailComponents/PrivateMessagesEmail';
import { EventDebouncer } from './debouncer';
import * as _ from 'underscore';
import { Components } from '../lib/vulcan-lib/components';
import { updateMutator } from './vulcan-lib/mutators';
import { getCollectionHooks } from './mutationCallbacks';
import { asyncForeachSequential } from '../lib/utils/asyncUtils';
import { CallbackHook } from '../lib/vulcan-lib/callbacks';

import React from 'react';
import TagRels from '../lib/collections/tagRels/collection';
import { RSVPType } from '../lib/collections/posts/schema';
import { forumTypeSetting } from '../lib/instanceSettings';
import { getSubscribedUsers, createNotifications, getUsersWhereLocationIsInNotificationRadius } from './notificationCallbacksHelpers'
import moment from 'moment';
import difference from 'lodash/difference';
import uniq from 'lodash/uniq';
import Messages from '../lib/collections/messages/collection';
import Tags from '../lib/collections/tags/collection';
import { subforumGetSubscribedUsers } from '../lib/collections/tags/helpers';
import UserTagRels from '../lib/collections/userTagRels/collection';
import { REVIEW_AND_VOTING_PHASE_VOTECOUNT_THRESHOLD } from '../lib/reviewUtils';
import { commentIsHidden } from '../lib/collections/comments/helpers';

// Callback for a post being published. This is distinct from being created in
// that it doesn't fire on draft posts, and doesn't fire on posts that are awaiting
// moderator approval because they're a user's first post (but does fire when
// they're approved).
export const postPublishedCallback = new CallbackHook<[DbPost]>("post.published");

const removeNotification = async (notificationId: string) => {
  await updateMutator({
    collection: Notifications,
    documentId: notificationId,
    data: { deleted: true },
    validate: false
  })
}

const sendPostByEmail = async ({users, postId, reason, subject}: {
  users: Array<DbUser>,
  postId: string,
  reason: string,
  
  // Subject line to use in the email. If omitted, uses the post title.
  subject?: string,
}) => {
  let post = await Posts.findOne(postId);
  if (!post) throw Error(`Can't find post to send by email: ${postId}`)
  for(let user of users) {
    if(!reasonUserCantReceiveEmails(user)) {
      await wrapAndSendEmail({
        user,
        subject: subject ?? post.title,
        body: <Components.NewPostEmail documentId={post._id} reason={reason}/>
      });
    } else {
      //eslint-disable-next-line no-console
      console.log(`Skipping user ${user.username} when emailing: ${reasonUserCantReceiveEmails(user)}`);
    }
  }
}


// Add notification callback when a post is approved
getCollectionHooks("Posts").editAsync.add(function PostsEditRunPostApprovedAsyncCallbacks(post, oldPost) {
  if (postIsApproved(post) && !postIsApproved(oldPost)) {
    void createNotifications({userIds: [post.userId], notificationType: 'postApproved', documentType: 'post', documentId: post._id});
  }
});

function postIsPublic (post: DbPost) {
  return !post.draft && post.status === postStatuses.STATUS_APPROVED
}

// Export for testing
/** create notifications for a new post being published */
export async function postsNewNotifications (post: DbPost) {
  if (postIsPublic(post)) {
    // track the users who we've notified, so that we only do so once per user, even if they qualify for more than one notification -
    // start by excluding the post author
    let userIdsNotified: string[] = [post.userId];
    
    // first, if the post is in a group, notify all users who are subscribed to the group
    if (post.groupId) {
      // Load the group, so we know who the organizers are
      const group = await Localgroups.findOne(post.groupId);
      if (group) {
        const organizerIds = group.organizerIds;
        const groupSubscribedUsers = await getSubscribedUsers({
          documentId: post.groupId,
          collectionName: "Localgroups",
          type: subscriptionTypes.newEvents,
          potentiallyDefaultSubscribedUserIds: organizerIds,
          userIsDefaultSubscribed: u => u.autoSubscribeAsOrganizer,
        });
        
        const userIdsToNotify = _.difference(groupSubscribedUsers.map(user => user._id), userIdsNotified)
        if (post.isEvent) {
          await createNotifications({userIds: userIdsToNotify, notificationType: 'newEvent', documentType: 'post', documentId: post._id});
        } else {
          await createNotifications({userIds: userIdsToNotify, notificationType: 'newGroupPost', documentType: 'post', documentId: post._id});
        }
        // don't notify these users again
        userIdsNotified = _.union(userIdsNotified, userIdsToNotify)
      }
    }
    
    // then notify all users who want to be notified of events in a radius
    if (post.isEvent && post.mongoLocation) {
      const radiusNotificationUsers = await getUsersWhereLocationIsInNotificationRadius(post.mongoLocation)
      const userIdsToNotify = _.difference(radiusNotificationUsers.map(user => user._id), userIdsNotified)
      await createNotifications({userIds: userIdsToNotify, notificationType: "newEventInRadius", documentType: "post", documentId: post._id})
      // don't notify these users again
      userIdsNotified = _.union(userIdsNotified, userIdsToNotify)
    }
    
    // finally notify all users who are subscribed to the post's author
    let authorSubscribedUsers = await getSubscribedUsers({
      documentId: post.userId,
      collectionName: "Users",
      type: subscriptionTypes.newPosts
    })
    const userIdsToNotify = _.difference(authorSubscribedUsers.map(user => user._id), userIdsNotified)
    await createNotifications({userIds: userIdsToNotify, notificationType: 'newPost', documentType: 'post', documentId: post._id});
  }
}

postPublishedCallback.add(postsNewNotifications);

function eventHasRelevantChangeForNotification(oldPost: DbPost, newPost: DbPost) {
  const oldLocation = oldPost.googleLocation?.geometry?.location;
  const newLocation = newPost.googleLocation?.geometry?.location;
  if (!!oldLocation !== !!newLocation) {
    //Location added or removed
    return true;
  }
  if (oldLocation && newLocation && !_.isEqual(oldLocation, newLocation)) {
    // Location changed
    // NOTE: We treat the added/removed and changed cases separately because a
    // dumb thing inside the mutation callback handlers mixes up null vs
    // undefined, causing callbacks to get a spurious change from null to
    // undefined which should not trigger a notification.
    return true;
  }

  /* 
   * moment(null) is not the same as moment(undefined), which started happening after the postgres migration of posts for events that didn't have endTimes.
   * We can't check moment(null).isSame(moment(null)), since that always returns false.
   * moment(undefined).isSame(moment(undefined)) often returns true but that's actually not guaranteed, so it's not safe to rely on.
   * We shouldn't send a notification in those cases, obviously.
   */
  const { startTime: oldStartTime, endTime: oldEndTime } = oldPost;
  const { startTime: newStartTime, endTime: newEndTime } = newPost;

  const startTimeAddedOrRemoved = !!oldStartTime !== !!newStartTime;
  const endTimeAddedOrRemoved = !!oldEndTime !== !!newEndTime;

  const startTimeChanged = oldStartTime && newStartTime && !moment(newStartTime).isSame(moment(oldStartTime));
  const endTimeChanged = oldEndTime && newEndTime && !moment(newEndTime).isSame(moment(oldEndTime));

  if ((newPost.joinEventLink ?? null) !== (oldPost.joinEventLink ?? null)
    || startTimeAddedOrRemoved
    || startTimeChanged
    || endTimeAddedOrRemoved
    || endTimeChanged
  ) {
    // Link, start time, or end time changed
    return true;
  }
  
  return false;
}

getCollectionHooks("Posts").updateAsync.add(async function eventUpdatedNotifications ({document: newPost, oldDocument: oldPost}: {document: DbPost, oldDocument: DbPost}) {
  // don't bother notifying people about past or unscheduled events
  const isUpcomingEvent = newPost.startTime && moment().isBefore(moment(newPost.startTime))
  // only send notifications if the event was already published *before* being edited
  const alreadyPublished = !oldPost.draft && !newPost.draft && !oldPost.authorIsUnreviewed && !newPost.authorIsUnreviewed
  if (eventHasRelevantChangeForNotification(oldPost, newPost)
    && newPost.isEvent && isUpcomingEvent && alreadyPublished
  ) {
    // track the users who we've notified, so that we only do so once per user, even if they qualify for more than one notification
    let userIdsNotified: string[] = []

    // first email everyone who RSVP'd to the event
    const rsvpUsers = await getUsersToNotifyAboutEvent(newPost)
    for (let {userId,email} of rsvpUsers) {
      if (!email) continue
      const user = await Users.findOne(userId)
      if (userId) {
        userIdsNotified.push(userId)
      }
      
      await wrapAndSendEmail({
        user: user,
        to: email,
        subject: `Event updated: ${newPost.title}`,
        body: <Components.EventUpdatedEmail postId={newPost._id} />
      });
    }
    
    // then notify all users who want to be notified of events in a radius
    if (newPost.mongoLocation) {
      const radiusNotificationUsers = await getUsersWhereLocationIsInNotificationRadius(newPost.mongoLocation)
      const userIdsToNotify = _.difference(radiusNotificationUsers.map(user => user._id), userIdsNotified)
      await createNotifications({userIds: userIdsToNotify, notificationType: "editedEventInRadius", documentType: "post", documentId: newPost._id})
    }
  }
});

getCollectionHooks("Posts").editAsync.add(async function RemoveRedraftNotifications(newPost: DbPost, oldPost: DbPost) {
  if (!postIsPublic(newPost) && postIsPublic(oldPost)) {
      //eslint-disable-next-line no-console
    console.info("Post redrafted, removing notifications");

    // delete post notifications
    const postNotifications = await Notifications.find({documentId: newPost._id}).fetch()
    postNotifications.forEach(notification => removeNotification(notification._id))
    // delete tagRel notifications
    const tagRels = await TagRels.find({postId:newPost._id}).fetch()
    await asyncForeachSequential(tagRels, async (tagRel) => {
      const tagRelNotifications = await Notifications.find({documentId: tagRel._id}).fetch()
      tagRelNotifications.forEach(notification => removeNotification(notification._id))
    })
  }
});

async function findUsersToEmail(filter: MongoSelector<DbUser>) {
  let usersMatchingFilter = await Users.find(filter).fetch();
  if (forumTypeSetting.get() === 'EAForum') {
    return usersMatchingFilter
  }

  let usersToEmail = usersMatchingFilter.filter(u => {
    if (u.email && u.emails && u.emails.length) {
      let primaryAddress = u.email;

      for(let i=0; i<u.emails.length; i++)
      {
        if(u.emails[i] && u.emails[i].address === primaryAddress && u.emails[i].verified)
          return true;
      }
      return false;
    } else {
      return false;
    }
  });
  return usersToEmail
}

const curationEmailDelay = new EventDebouncer({
  name: "curationEmail",
  defaultTiming: {
    type: "delayed",
    delayMinutes: 20,
  },
  callback: async (postId) => {
    const post = await Posts.findOne(postId);
    
    // Still curated? If it was un-curated during the 20 minute delay, don't
    // send emails.
    if (post?.curatedDate) {
      //eslint-disable-next-line no-console
      console.log(`Sending curation emails`);

      // Email only non-admins (admins get emailed immediately, without the
      // delay).
      let usersToEmail = await findUsersToEmail({'emailSubscribedToCurated': true});

      //eslint-disable-next-line no-console
      console.log(`Found ${usersToEmail.length} users to email`);
      await sendPostByEmail({
        users: usersToEmail,
        postId,
        reason: "you have the \"Email me new posts in Curated\" option enabled"
      });
    } else {
      //eslint-disable-next-line no-console
      console.log(`Not sending curation notice for ${post?.title} because it was un-curated during the delay period.`);
    }
  }
});

getCollectionHooks("Posts").editAsync.add(async function PostsCurateNotification (post: DbPost, oldPost: DbPost) {
  if(post.curatedDate && !oldPost.curatedDate && forumTypeSetting.get() !== "EAForum") {
    // Email admins immediately, everyone else after a 20-minute delay, so that
    // we get a chance to catch formatting issues with the email.
    
    const adminsToEmail = await findUsersToEmail({'emailSubscribedToCurated': true, isAdmin: true});
    await sendPostByEmail({
      users: adminsToEmail,
      postId: post._id,
      reason: "you have the \"Email me new posts in Curated\" option enabled",
      subject: `[Admin preview] ${post.title}`,
    });
    
    await curationEmailDelay.recordEvent({
      key: post._id,
      af: false
    });
  }
});

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
    let tagSubscriberIdsToNotify = _.difference(subscribedUserIds, [tagRel.userId])

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
      return user.email
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
  
  if (post?.isEvent) {
    await notifyRsvps(comment, post);
  }

  // keep track of whom we've notified (so that we don't notify the same user twice for one comment,
  // if e.g. they're both the author of the post and the author of a comment being replied to)
  let notifiedUsers: Array<string> = [];

  // 1. Notify users who are subscribed to the parent comment
  if (comment.parentCommentId) {
    const parentComment = await Comments.findOne(comment.parentCommentId)
    if (parentComment) {
      const subscribedUsers = await getSubscribedUsers({
        documentId: comment.parentCommentId,
        collectionName: "Comments",
        type: subscriptionTypes.newReplies,
        potentiallyDefaultSubscribedUserIds: [parentComment.userId],
        userIsDefaultSubscribed: u => u.auto_subscribe_to_my_comments
      })
      const subscribedUserIds = _.map(subscribedUsers, u=>u._id);
      
      // Don't notify the author of their own comment, and filter out the author
      // of the parent-comment to be treated specially (with a newReplyToYou
      // notification instead of a newReply notification).
      let parentCommentSubscriberIdsToNotify = _.difference(subscribedUserIds, [comment.userId, parentComment.userId])
      await createNotifications({userIds: parentCommentSubscriberIdsToNotify, notificationType: 'newReply', documentType: 'comment', documentId: comment._id});

      // Separately notify author of comment with different notification, if
      // they are subscribed, and are NOT the author of the comment
      if (subscribedUserIds.includes(parentComment.userId) && parentComment.userId !== comment.userId) {
        await createNotifications({userIds: [parentComment.userId], notificationType: 'newReplyToYou', documentType: 'comment', documentId: comment._id});
        notifiedUsers = [...notifiedUsers, parentComment.userId];
      }
    }
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

getCollectionHooks("Conversations").editAsync.add(async function conversationEditNotification(conversation: DbConversation, oldConversation: DbConversation) {
  const newParticipantIds = difference(conversation.participantIds || [], oldConversation.participantIds || []);

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

getCollectionHooks("Posts").editAsync.add(async function PostsEditNotifyUsersSharedOnPost (newPost: DbPost, oldPost: DbPost) {
  if (!_.isEqual(newPost.shareWithUsers, oldPost.shareWithUsers)) {
    // Right now this only creates notifications when users are shared (and not when they are "unshared")
    // because currently notifications are hidden from you if you don't have view-access to a post.
    // TODO: probably fix that, such that users can see when they've lost access to post. [but, eh, I'm not sure this matters that much]
    const sharedUsers = _.difference(newPost.shareWithUsers || [], oldPost.shareWithUsers || [])
    await createNotifications({userIds: sharedUsers, notificationType: "postSharedWithUser", documentType: "post", documentId: newPost._id})
  }
});

getCollectionHooks("Posts").newAsync.add(async function PostsNewNotifyUsersSharedOnPost (post: DbPost) {
  const { _id, shareWithUsers = [], coauthorStatuses } = post;
  const coauthors: Array<string> = coauthorStatuses?.filter(({ confirmed }) => confirmed).map(({ userId }) => userId) || [];
  const userIds: Array<string> = shareWithUsers?.filter((user) => !coauthors.includes(user)) || [];
  await createNotifications({userIds, notificationType: "postSharedWithUser", documentType: "post", documentId: _id})
});

const sendCoauthorRequestNotifications = async (post: DbPost) => {
  const { _id, coauthorStatuses, hasCoauthorPermission } = post;

  if (hasCoauthorPermission === false && coauthorStatuses?.length) {
    await createNotifications({
      userIds: coauthorStatuses.filter(({requested, confirmed}) => !requested && !confirmed).map(({userId}) => userId),
      notificationType: "coauthorRequestNotification",
      documentType: "post",
      documentId: _id,
    });

    post.coauthorStatuses = coauthorStatuses.map((status) => ({ ...status, requested: true }));
    await Posts.rawUpdateOne({ _id }, { $set: { coauthorStatuses: post.coauthorStatuses } });
  }

  return post;
}

getCollectionHooks("Posts").newAfter.add(sendCoauthorRequestNotifications);
getCollectionHooks("Posts").updateAfter.add(sendCoauthorRequestNotifications);

const AlignmentSubmissionApprovalNotifyUser = async (newDocument: DbPost|DbComment, oldDocument: DbPost|DbComment) => {
  const newlyAF = newDocument.af && !oldDocument.af
  const userSubmitted = oldDocument.suggestForAlignmentUserIds && oldDocument.suggestForAlignmentUserIds.includes(oldDocument.userId)
  const reviewed = !!newDocument.reviewForAlignmentUserId
  
  const documentType =  newDocument.hasOwnProperty("answer") ? 'comment' : 'post'
  
  if (newlyAF && userSubmitted && reviewed) {
    await createNotifications({userIds: [newDocument.userId], notificationType: "alignmentSubmissionApproved", documentType, documentId: newDocument._id})
  }
}

getCollectionHooks("Posts").editAsync.add(AlignmentSubmissionApprovalNotifyUser)
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
