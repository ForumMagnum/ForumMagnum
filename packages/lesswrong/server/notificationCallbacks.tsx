import Notifications from '../lib/collections/notifications/collection';
import Messages from '../lib/collections/messages/collection';
import { messageGetLink } from '../lib/helpers';
import Conversations from '../lib/collections/conversations/collection';
import Subscriptions from '../lib/collections/subscriptions/collection';
import { subscriptionTypes } from '../lib/collections/subscriptions/schema';
import Localgroups from '../lib/collections/localgroups/collection';
import Users from '../lib/collections/users/collection';
import { getUserEmail, userGetProfileUrl } from '../lib/collections/users/helpers';
import { Posts } from '../lib/collections/posts';
import { postStatuses } from '../lib/collections/posts/constants';
import { postGetPageUrl, postIsApproved } from '../lib/collections/posts/helpers';
import { Comments } from '../lib/collections/comments/collection'
import { commentGetPageUrlFromDB } from '../lib/collections/comments/helpers'
import { reasonUserCantReceiveEmails, wrapAndSendEmail } from './emails/renderEmail';
import './emailComponents/EmailWrapper';
import './emailComponents/NewPostEmail';
import './emailComponents/PostNominatedEmail';
import './emailComponents/PrivateMessagesEmail';
import { EventDebouncer, DebouncerTiming } from './debouncer';
import { getNotificationTypeByName } from '../lib/notificationTypes';
import { notificationDebouncers } from './notificationBatching';
import { defaultNotificationTypeSettings } from '../lib/collections/users/custom_fields';
import { ensureIndex } from '../lib/collectionUtils';
import * as _ from 'underscore';
import { Components } from '../lib/vulcan-lib/components';
import { createMutator, updateMutator } from './vulcan-lib/mutators';
import { getCollectionHooks } from './mutationCallbacks';
import { asyncForeachSequential } from '../lib/utils/asyncUtils';
import { CallbackHook } from '../lib/vulcan-lib/callbacks';

import React from 'react';
import keyBy from 'lodash/keyBy';
import TagRels from '../lib/collections/tagRels/collection';
import { RSVPType } from '../lib/collections/posts/schema';
import { forumTypeSetting } from '../lib/instanceSettings';

// Callback for a post being published. This is distinct from being created in
// that it doesn't fire on draft posts, and doesn't fire on posts that are awaiting
// moderator approval because they're a user's first post (but does fire when
// they're approved).
export const postPublishedCallback = new CallbackHook<[DbPost]>("post.published");


/**
 * Return a list of users (as complete user objects) subscribed to a given
 * document. This is the union of users who have subscribed to it explicitly,
 * and users who were subscribed to it by default and didn't suppress the
 * subscription.
 *
 * documentId: The document to look for subscriptions to.
 * collectionName: The collection the document to look for subscriptions to is in.
 * type: The type of subscription to check for.
 * potentiallyDefaultSubscribedUserIds: (Optional) An array of user IDs for
 *   users who are potentially subscribed to this document by default, eg
 *   because they wrote the post being replied to or are an organizer of the
 *   group posted in.
 * userIsDefaultSubscribed: (Optional. User=>bool) If
 *   potentiallyDefaultSubscribedUserIds is given, takes a user and returns
 *   whether they would be default-subscribed to this document.
 */
export async function getSubscribedUsers({
  documentId, collectionName, type,
  potentiallyDefaultSubscribedUserIds=null, userIsDefaultSubscribed=null
}: {
  documentId: string|null,
  collectionName: CollectionNameString,
  type: string,
  potentiallyDefaultSubscribedUserIds?: null|Array<string>,
  userIsDefaultSubscribed?: null|((u:DbUser)=>boolean),
}) {
  if (!documentId) {
    return [];
  }
  
  const subscriptions = await Subscriptions.find({documentId, type, collectionName, deleted: false, state: 'subscribed'}).fetch()
  const explicitlySubscribedUserIds = _.pluck(subscriptions, 'userId')
  
  const explicitlySubscribedUsers = await Users.find({_id: {$in: explicitlySubscribedUserIds}}).fetch()
  const explicitlySubscribedUsersDict = keyBy(explicitlySubscribedUsers, u=>u._id);
  
  // Handle implicitly subscribed users
  if (potentiallyDefaultSubscribedUserIds && potentiallyDefaultSubscribedUserIds.length>0) {
    // Filter explicitly-subscribed users out of the potentially-implicitly-subscribed
    // users list, since their subscription status is already known
    potentiallyDefaultSubscribedUserIds = _.filter(potentiallyDefaultSubscribedUserIds, id=>!(id in explicitlySubscribedUsersDict));
    
    // Fetch and filter potentially-subscribed users
    const potentiallyDefaultSubscribedUsers: Array<DbUser> = await Users.find({
      _id: {$in: potentiallyDefaultSubscribedUserIds}
    }).fetch();
    // @ts-ignore @types/underscore annotated this wrong; the filter is optional, if it's null then everything passes
    const defaultSubscribedUsers: Array<DbUser> = _.filter(potentiallyDefaultSubscribedUsers, userIsDefaultSubscribed);
    
    // Check for suppression in the subscriptions table
    const suppressions = await Subscriptions.find({documentId, type, collectionName, deleted: false, state: "suppressed"}).fetch();
    const suppressionsByUserId = keyBy(suppressions, s=>s.userId);
    const defaultSubscribedUsersNotSuppressed = _.filter(defaultSubscribedUsers, u=>!(u._id in suppressionsByUserId))
    
    return _.union(explicitlySubscribedUsers, defaultSubscribedUsersNotSuppressed);
  } else {
    return explicitlySubscribedUsers;
  }
}


export const createNotifications = async ({ userIds, notificationType, documentType, documentId, noEmail }:{
  userIds: Array<string>
  notificationType: string,
  documentType: string|null,
  documentId: string|null,
  noEmail?: boolean|null
}) => { 
  return Promise.all(
    userIds.map(async userId => {
      await createNotification({userId, notificationType, documentType, documentId, noEmail});
    })
  );
}

const getNotificationTiming = (typeSettings): DebouncerTiming => {
  switch (typeSettings.batchingFrequency) {
    case "realtime":
      return { type: "none" };
    case "daily":
      return {
        type: "daily",
        timeOfDayGMT: typeSettings.timeOfDayGMT,
      };
    case "weekly":
      return {
        type: "weekly",
        timeOfDayGMT: typeSettings.timeOfDayGMT,
        dayOfWeekGMT: typeSettings.dayOfWeekGMT,
      };
    default:
      // eslint-disable-next-line no-console
      console.error(`Unrecognized batching frequency: ${typeSettings.batchingFrequency}`);
      return { type: "none" };
  }
}


export const createNotification = async ({userId, notificationType, documentType, documentId, noEmail}:{
    userId: string,
    notificationType: string,
    documentType: string|null,
    documentId: string|null,
    noEmail?: boolean|null
  }) => { 
  let user = await Users.findOne({ _id:userId });
  if (!user) throw Error(`Wasn't able to find user to create notification for with id: ${userId}`)
  const userSettingField = getNotificationTypeByName(notificationType).userSettingField;
  const notificationTypeSettings = (userSettingField && user[userSettingField]) ? user[userSettingField] : defaultNotificationTypeSettings;

  let notificationData = {
    userId: userId,
    documentId: documentId||undefined,
    documentType: documentType||undefined,
    message: await notificationMessage(notificationType, documentType, documentId),
    type: notificationType,
    link: await getLink(notificationType, documentType, documentId),
  }

  if (notificationTypeSettings.channel === "onsite" || notificationTypeSettings.channel === "both")
  {
    const createdNotification = await createMutator({
      collection: Notifications,
      document: {
        ...notificationData,
        emailed: false,
        waitingForBatch: notificationTypeSettings.batchingFrequency !== "realtime",
      },
      currentUser: user,
      validate: false
    });
    if (notificationTypeSettings.batchingFrequency !== "realtime") {
      await notificationDebouncers[notificationType]!.recordEvent({
        key: {notificationType, userId},
        data: createdNotification.data._id,
        timing: getNotificationTiming(notificationTypeSettings),
        af: false, //TODO: Handle AF vs non-AF notifications
      });
    }
  }
  if ((notificationTypeSettings.channel === "email" || notificationTypeSettings.channel === "both") && !noEmail) {
    const createdNotification = await createMutator({
      collection: Notifications,
      document: {
        ...notificationData,
        emailed: true,
        waitingForBatch: true,
      },
      currentUser: user,
      validate: false
    });
    if (!notificationDebouncers[notificationType])
      throw new Error("Invalid notification type");
    await notificationDebouncers[notificationType]!.recordEvent({
      key: {notificationType, userId},
      data: createdNotification.data._id,
      timing: getNotificationTiming(notificationTypeSettings),
      af: false, //TODO: Handle AF vs non-AF notifications
    });
  }
}

const removeNotification = async (notificationId: string) => {
  await updateMutator({
    collection: Notifications,
    documentId: notificationId,
    data: { deleted: true },
    validate: false
  })
}

const sendPostByEmail = async (users: Array<DbUser>, postId: string, reason: string) => {
  let post = await Posts.findOne(postId);
  if (!post) throw Error(`Can't find post to send by email: ${postId}`)
  for(let user of users) {
    if(!reasonUserCantReceiveEmails(user)) {
      await wrapAndSendEmail({
        user,
        subject: post.title,
        body: <Components.NewPostEmail documentId={post._id} reason={reason}/>
      });
    } else {
      //eslint-disable-next-line no-console
      console.log(`Skipping user ${user.username} when emailing: ${reasonUserCantReceiveEmails(user)}`);
    }
  }
}

const getLink = async (notificationType: string, documentType: string|null, documentId: string|null) => {
  let document = await getDocument(documentType, documentId);

  switch(notificationType) {
    case "emailVerificationRequired":
      return "/resendVerificationEmail";
    default:
      // Fall through to based on document-type
      break;
  }
  
  switch(documentType) {
    case "post":
      return postGetPageUrl(document as DbPost);
    case "comment":
      return await commentGetPageUrlFromDB(document as DbComment);
    case "user":
      return userGetProfileUrl(document as DbUser);
    case "message":
      return messageGetLink(document as DbMessage);
    case "tagRel":
      const post = await Posts.findOne({_id: (document as DbTagRel).postId})
      return postGetPageUrl(post as DbPost);
    default:
      //eslint-disable-next-line no-console
      console.error("Invalid notification type");
  }
}

const notificationMessage = async (notificationType: string, documentType: string|null, documentId: string|null) => {
  return await getNotificationTypeByName(notificationType)
    .getMessage({documentType, documentId});
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
      return await TagRels.findOne(documentId)
    default:
      //eslint-disable-next-line no-console
      console.error(`Invalid documentType type: ${documentType}`);
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

async function getUsersWhereLocationIsInNotificationRadius(location): Promise<Array<DbUser>> {
  return await Users.aggregate([
    {
      "$geoNear": {
        "near": location, 
        "spherical": true,
        "distanceField": "distance",
        "distanceMultiplier": 0.001,
        "maxDistance": 300000, // 300km is maximum distance we allow to set in the UI
        "key": "nearbyEventsNotificationsMongoLocation"
      }
    },
    {
      "$match": {
        "$expr": {
            "$gt": ["$nearbyEventsNotificationsRadius", "$distance"]
        }
      }
    }
  ]).toArray()
}
ensureIndex(Users, {nearbyEventsNotificationsMongoLocation: "2dsphere"}, {name: "users.nearbyEventsNotifications"})

// Export for testing
/** Add new post notification callback on post submit */
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
        if (post.groupId && post.isEvent) {
          await createNotifications({userIds: userIdsToNotify, notificationType: 'newEvent', documentType: 'post', documentId: post._id});
        } else if (post.groupId && !post.isEvent) {
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

getCollectionHooks("Posts").updateAsync.add(async function PostsEditMeetupNotifications ({document: newPost, oldDocument: oldPost}: {document: DbPost, oldDocument: DbPost}) {
  if (
    (
      !_.isEqual(newPost.mongoLocation, oldPost.mongoLocation) ||
      (newPost.startTime !== oldPost.startTime) || 
      (newPost.endTime !== oldPost.endTime)
    )
    && newPost.mongoLocation && newPost.isEvent && !newPost.draft && !newPost.authorIsUnreviewed)
  {
    const usersToNotify = await getUsersWhereLocationIsInNotificationRadius(newPost.mongoLocation)
    const userIds = usersToNotify.map(user => user._id)
    const usersIdsWithoutAuthor = userIds.filter(id => id !== newPost.userId)
    await createNotifications({userIds: usersIdsWithoutAuthor, notificationType: "editedEventInRadius", documentType: "post", documentId: newPost._id})
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
        if(u.emails[i].address === primaryAddress && u.emails[i].verified)
          return true;
      }
      return false;
    } else {
      return false;
    }
  });
  return usersToEmail
}

const curationEmailDelay = new EventDebouncer<string,null>({
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
      // Email only non-admins (admins get emailed immediately, without the
      // delay).
      let usersToEmail = await findUsersToEmail({'emailSubscribedToCurated': true, isAdmin: false});
      await sendPostByEmail(usersToEmail, postId, "you have the \"Email me new posts in Curated\" option enabled");
    } else {
      //eslint-disable-next-line no-console
      console.log(`Not sending curation notice for ${post?.title} because it was un-curated during the delay period.`);
    }
  }
});

getCollectionHooks("Posts").editAsync.add(async function PostsCurateNotification (post: DbPost, oldPost: DbPost) {
  if(post.curatedDate && !oldPost.curatedDate) {
    // Email admins immediately, everyone else after a 20-minute delay, so that
    // we get a chance to catch formatting issues with the email.
    
    const adminsToEmail = await findUsersToEmail({'emailSubscribedToCurated': true, isAdmin: true});
    await sendPostByEmail(adminsToEmail, post._id, "you have the \"Email me new posts in Curated\" option enabled");
    
    await curationEmailDelay.recordEvent({
      key: post._id,
      data: null,
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
  if (post && postIsPublic(post)) {
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
      return getUserEmail(user)
    }
  }
}


export async function getUsersToNotifyAboutEvent(post: DbPost): Promise<{rsvp: RSVPType, userId: string|null, email: string|undefined}[]> {
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

getCollectionHooks("ReviewVotes").newAsync.add(async function PositiveReviewVoteNotifications(reviewVote: DbReviewVote) {
  const post = reviewVote.postId ? await Posts.findOne(reviewVote.postId) : null;
  if (post && post.positiveReviewVoteCount > 1) {
    const notifications = await Notifications.find({documentId:post._id, type: "postNominated" }).fetch()
    if (!notifications.length) {
      await createNotifications({userIds: [post.userId], notificationType: "postNominated", documentType: "post", documentId: post._id})
    }
  }
})

// add new comment notification callback on comment submit
getCollectionHooks("Comments").newAsync.add(async function CommentsNewNotifications(comment: DbComment) {
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
  
  // 2. Notify users who are subscribed to the post (which may or may not include the post's author)
  let userIdsSubscribedToPost: Array<string> = [];
  const usersSubscribedToPost = await getSubscribedUsers({
    documentId: comment.postId,
    collectionName: "Posts",
    type: subscriptionTypes.newComments,
    potentiallyDefaultSubscribedUserIds: post ? [post.userId] : [],
    userIsDefaultSubscribed: u => u.auto_subscribe_to_my_posts
  })
  userIdsSubscribedToPost = _.map(usersSubscribedToPost, u=>u._id);

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
  if (post.shareWithUsers?.length) {
    await createNotifications({userIds: post.shareWithUsers, notificationType: "postSharedWithUser", documentType: "post", documentId: post._id})
  }
});

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

