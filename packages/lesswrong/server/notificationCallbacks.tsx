import Notifications from '../lib/collections/notifications/collection';
import Messages from '../lib/collections/messages/collection';
import { messageGetLink } from '../lib/helpers';
import Conversations from '../lib/collections/conversations/collection';
import Subscriptions from '../lib/collections/subscriptions/collection';
import { subscriptionTypes } from '../lib/collections/subscriptions/schema';
import Localgroups from '../lib/collections/localgroups/collection';
import Users from '../lib/collections/users/collection';
import { userGetProfileUrl } from '../lib/collections/users/helpers';
import { Posts } from '../lib/collections/posts';
import { postStatuses } from '../lib/collections/posts/constants';
import { postGetPageUrl, postIsApproved } from '../lib/collections/posts/helpers';
import { Comments } from '../lib/collections/comments/collection'
import { commentGetPageUrl } from '../lib/collections/comments/helpers'
import { reasonUserCantReceiveEmails } from './emails/renderEmail';
import './emailComponents/EmailWrapper';
import './emailComponents/NewPostEmail';
import './emailComponents/PrivateMessagesEmail';
import { EventDebouncer, DebouncerTiming } from './debouncer';
import { getNotificationTypeByName } from '../lib/notificationTypes';
import { notificationDebouncers, wrapAndSendEmail } from './notificationBatching';
import { defaultNotificationTypeSettings } from '../lib/collections/users/custom_fields';
import { ensureIndex } from '../lib/collectionUtils';
import * as _ from 'underscore';
import { isServer } from '../lib/executionEnvironment';
import { Components, createMutator, updateMutator } from './vulcan-lib';
import { getCollectionHooks } from './mutationCallbacks';

import React from 'react';
import keyBy from 'lodash/keyBy';
import TagRels from '../lib/collections/tagRels/collection';

// Return a list of users (as complete user objects) subscribed to a given
// document. This is the union of users who have subscribed to it explicitly,
// and users who were subscribed to it by default and didn't suppress the
// subscription.
//
// documentId: The document to look for subscriptions to.
// collectionName: The collection the document to look for subscriptions to is in.
// type: The type of subscription to check for.
// potentiallyDefaultSubscribedUserIds: (Optional) An array of user IDs for
//   users who are potentially subscribed to this document by default, eg
//   because they wrote the post being replied to or are an organizer of the
//   group posted in.
// userIsDefaultSubscribed: (Optional. User=>bool) If
//   potentiallyDefaultSubscribedUserIds is given, takes a user and returns
//   whether they would be default-subscribed to this document.
async function getSubscribedUsers({
  documentId, collectionName, type,
  potentiallyDefaultSubscribedUserIds=null, userIsDefaultSubscribed=null
}: {
  documentId: string,
  collectionName: CollectionNameString,
  type: string,
  potentiallyDefaultSubscribedUserIds?: null|Array<string>,
  userIsDefaultSubscribed?: null|((u:DbUser)=>boolean),
}) {
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

const createNotifications = async (userIds: Array<string>, notificationType: string, documentType, documentId) => {
  return Promise.all(
    userIds.map(async userId => {
      await createNotification(userId, notificationType, documentType, documentId);
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

const createNotification = async (userId: string, notificationType: string, documentType, documentId) => {
  let user = Users.findOne({ _id:userId });
  if (!user) throw Error(`Wasn't able to find user to create notification for with id: ${userId}`)
  const userSettingField = getNotificationTypeByName(notificationType).userSettingField;
  const notificationTypeSettings = (userSettingField && user[userSettingField]) ? user[userSettingField] : defaultNotificationTypeSettings;

  let notificationData = {
    userId: userId,
    documentId: documentId,
    documentType: documentType,
    message: notificationMessage(notificationType, documentType, documentId),
    type: notificationType,
    link: getLink(notificationType, documentType, documentId),
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
  if (notificationTypeSettings.channel === "email" || notificationTypeSettings.channel === "both") {
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

const getLink = (notificationType: string, documentType: string|null, documentId: string|null) => {
  let document = getDocument(documentType, documentId);

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
      return commentGetPageUrl(document as DbComment);
    case "user":
      return userGetProfileUrl(document as DbUser);
    case "message":
      return messageGetLink(document as DbMessage);
    case "tagRel":
      const post = Posts.findOne({_id: (document as DbTagRel).postId})
      return postGetPageUrl(post as DbPost);
    default:
      //eslint-disable-next-line no-console
      console.error("Invalid notification type");
  }
}

const notificationMessage = (notificationType, documentType, documentId) => {
  return getNotificationTypeByName(notificationType)
    .getMessage({documentType, documentId});
}

const getDocument = (documentType: string|null, documentId: string|null) => {
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
      return TagRels.findOne(documentId)
    default:
      //eslint-disable-next-line no-console
      console.error(`Invalid documentType type: ${documentType}`);
  }
}


// Add notification callback when a post is approved
getCollectionHooks("Posts").editAsync.add(function PostsEditRunPostApprovedAsyncCallbacks(post, oldPost) {
  if (postIsApproved(post) && !postIsApproved(oldPost)) {
    void createNotifications([post.userId], 'postApproved', 'post', post._id);
  }
});

export async function postsUndraftNotification(post: DbPost) {
  //eslint-disable-next-line no-console
  console.info("Post undrafted, creating notifications");

  await postsNewNotifications(post);
}

function postIsPublic (post: DbPost) {
  return !post.draft && post.status === postStatuses.STATUS_APPROVED
}

// Add new post notification callback on post submit
async function postsNewNotifications (post: DbPost) {
  if (postIsPublic(post)) {

    // add users who are subscribed to this post's author
    let usersToNotify = await getSubscribedUsers({
      documentId: post.userId,
      collectionName: "Users",
      type: subscriptionTypes.newPosts
    })

    // add users who are subscribed to this post's groups
    if (post.groupId) {
      // Load the group, so we know who the organizers are
      const group = await Localgroups.findOne(post.groupId);
      if (group) {
        const organizerIds = group.organizerIds;
        const subscribedUsers = await getSubscribedUsers({
          documentId: post.groupId,
          collectionName: "Localgroups",
          type: subscriptionTypes.newEvents,
          potentiallyDefaultSubscribedUserIds: organizerIds,
          userIsDefaultSubscribed: u => u.autoSubscribeAsOrganizer,
        });
        usersToNotify = _.union(usersToNotify, subscribedUsers)
      }
    }
    
    // remove this post's author
    // TODO: Removed because this was written in a way that didn't work and didn't
    // typecheck, but also, it seems fine for people to get notifications for their
    // own submissions to localgroups? It's nice to have a preview of what other
    // subscribed users would see.
    //usersToNotify = _.without(usersToNotify, post.userId);
    
    const userIdsToNotify = _.map(usersToNotify, u=>u._id);

    if (post.groupId && post.isEvent) {
      await createNotifications(userIdsToNotify, 'newEvent', 'post', post._id);
    } else if (post.groupId && !post.isEvent) {
      await createNotifications(userIdsToNotify, 'newGroupPost', 'post', post._id);
    } else {
      await createNotifications(userIdsToNotify, 'newPost', 'post', post._id);
    }

  }
}
getCollectionHooks("Posts").newAsync.add(postsNewNotifications);

getCollectionHooks("Posts").editAsync.add(async function RemoveRedraftNotifications(newPost: DbPost, oldPost: DbPost) {
  if (!postIsPublic(newPost) && postIsPublic(oldPost)) {
      //eslint-disable-next-line no-console
    console.info("Post redrafted, removing notifications");

    // delete post notifications
    const postNotifications = await Notifications.find({documentId: newPost._id}).fetch()
    postNotifications.forEach(notification => removeNotification(notification._id))
    // delete tagRel notifications
    const tagRels = await TagRels.find({postId:newPost._id}).fetch()
    tagRels.forEach(tagRel => {
      const tagRelNotifications = Notifications.find({documentId: tagRel._id}).fetch()
      tagRelNotifications.forEach(notification => removeNotification(notification._id))
    })
  }
});

function findUsersToEmail(filter) {
  let usersMatchingFilter = Users.find(filter).fetch();

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
      let usersToEmail = findUsersToEmail({'emailSubscribedToCurated': true, isAdmin: false});
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
    
    const adminsToEmail = findUsersToEmail({'emailSubscribedToCurated': true, isAdmin: true});
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
  const post = Posts.findOne({_id:tagRel.postId})
  if (post && postIsPublic(post)) {
    const subscribedUserIds = _.map(subscribedUsers, u=>u._id);
    
    // Don't notify the person who created the tagRel
    let tagSubscriberIdsToNotify = _.difference(subscribedUserIds, [tagRel.userId])

    //eslint-disable-next-line no-console
    console.info("Post tagged, creating notifications");
    await createNotifications(tagSubscriberIdsToNotify, 'newTagPosts', 'tagRel', tagRel._id);
  }
});

// add new comment notification callback on comment submit
getCollectionHooks("Comments").newAsync.add(async function CommentsNewNotifications(comment: DbComment) {
  if(isServer) {
    // keep track of whom we've notified (so that we don't notify the same user twice for one comment,
    // if e.g. they're both the author of the post and the author of a comment being replied to)
    let notifiedUsers: Array<any> = [];

    // 1. Notify users who are subscribed to the parent comment
    if (comment.parentCommentId) {
      const parentComment = Comments.findOne(comment.parentCommentId)
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
        await createNotifications(parentCommentSubscriberIdsToNotify, 'newReply', 'comment', comment._id);
  
        // Separately notify author of comment with different notification, if
        // they are subscribed, and are NOT the author of the comment
        if (subscribedUserIds.includes(parentComment.userId) && parentComment.userId !== comment.userId) {
          await createNotifications([parentComment.userId], 'newReplyToYou', 'comment', comment._id);
          notifiedUsers = [...notifiedUsers, parentComment.userId];
        }
      }
    }
    
    // 2. Notify users who are subscribed to the post (which may or may not include the post's author)
    let userIdsSubscribedToPost: Array<string> = [];
    if (comment.postId) {
      const post = await Posts.findOne(comment.postId);
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
        await createNotifications(userIdsSubscribedToShortform, 'newShortform', 'comment', comment._id);
        notifiedUsers = [ ...userIdsSubscribedToShortform, ...notifiedUsers]
      }
    }
    
    // remove userIds of users that have already been notified
    // and of comment author (they could be replying in a thread they're subscribed to)
    const postSubscriberIdsToNotify = _.difference(userIdsSubscribedToPost, [...notifiedUsers, comment.userId])
    if (postSubscriberIdsToNotify.length > 0) {
      await createNotifications(postSubscriberIdsToNotify, 'newComment', 'comment', comment._id)
    }
  }
});

getCollectionHooks("Messages").newAsync.add(async function messageNewNotification(message: DbMessage) {
  const conversationId = message.conversationId;
  const conversation = Conversations.findOne(conversationId);
  if (!conversation) throw Error(`Can't find conversation for message: ${message}`)
  
  // For on-site notifications, notify everyone except the sender of the
  // message. For email notifications, notify everyone including the sender
  // (since if there's a back-and-forth in the grouped notifications, you want
  // to see your own messages.)
  const recipientIds = conversation.participantIds.filter((id) => (id !== message.userId));

  // Create notification
  await createNotifications(recipientIds, 'newMessage', 'message', message._id);
});

export async function bellNotifyEmailVerificationRequired (user: DbUser) {
  await createNotifications([user._id], 'emailVerificationRequired', null, null);
}

getCollectionHooks("Posts").editAsync.add(async function PostsEditNotifyUsersSharedOnPost (newPost: DbPost, oldPost: DbPost) {
  if (!_.isEqual(newPost.shareWithUsers, oldPost.shareWithUsers)) {
    // Right now this only creates notifications when users are shared (and not when they are "unshared")
    // because currently notifications are hidden from you if you don't have view-access to a post.
    // TODO: probably fix that, such that users can see when they've lost access to post. [but, eh, I'm not sure this matters that much]
    const sharedUsers = _.difference(newPost.shareWithUsers || [], oldPost.shareWithUsers || [])
    await createNotifications(sharedUsers, "postSharedWithUser", "post", newPost._id)
  }
});

getCollectionHooks("Posts").newAsync.add(async function PostsNewNotifyUsersSharedOnPost (post: DbPost) {
  if (post.shareWithUsers?.length) {
    await createNotifications(post.shareWithUsers, "postSharedWithUser", "post", post._id)
  }
});

async function getUsersWhereLocationIsInNotificationRadius(location): Promise<Array<DbUser>> {
  return await Users.rawCollection().aggregate([
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

getCollectionHooks("Posts").createAsync.add(async function PostsNewMeetupNotifications ({document: newPost}: {document: DbPost}) {
  if (newPost.isEvent && newPost.mongoLocation && !newPost.draft) {
    const usersToNotify = await getUsersWhereLocationIsInNotificationRadius(newPost.mongoLocation)
    const userIds = usersToNotify.map(user => user._id)
    const usersIdsWithoutAuthor = userIds.filter(id => id !== newPost.userId)
    await createNotifications(usersIdsWithoutAuthor, "newEventInRadius", "post", newPost._id)
  }
});

getCollectionHooks("Posts").updateAsync.add(async function PostsEditMeetupNotifications ({document: newPost, oldDocument: oldPost}: {document: DbPost, oldDocument: DbPost}) {
  if (
    (
      (!newPost.draft && oldPost.draft) || 
      (newPost.mongoLocation && !newPost.mongoLocation) || 
      (newPost.startTime !== oldPost.startTime) || 
      (newPost.endTime !== oldPost.endTime) || 
      (newPost.contents?.html !== oldPost.contents?.html) ||
      (newPost.title !== oldPost.title)
    )
    && newPost.mongoLocation && newPost.isEvent && !newPost.draft) 
  {
    const usersToNotify = await getUsersWhereLocationIsInNotificationRadius(newPost.mongoLocation)
    const userIds = usersToNotify.map(user => user._id)
    const usersIdsWithoutAuthor = userIds.filter(id => id !== newPost.userId)
    await createNotifications(usersIdsWithoutAuthor, "editedEventInRadius", "post", newPost._id)
  }
});
