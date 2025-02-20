import Notifications from '../lib/collections/notifications/collection';
import Conversations from '../lib/collections/conversations/collection';
import Reports from '../lib/collections/reports/collection';

import { Bans } from '../lib/collections/bans/collection';
import Users from '../lib/collections/users/collection';
import { Votes } from '../lib/collections/votes/collection';
import { clearVotesServer } from './voteServer';
import { Posts } from '../lib/collections/posts/collection';
import { postStatuses } from '../lib/collections/posts/constants';
import { Comments } from '../lib/collections/comments/collection'
import { VoteableCollections } from '../lib/make_voteable';
import { postReportPurgeAsSpam, commentReportPurgeAsSpam } from './akismet';
import { capitalize } from '../lib/vulcan-lib/utils';
import { getCollectionHooks } from './mutationCallbacks';
import { asyncForeachSequential } from '../lib/utils/asyncUtils';
import Tags from '../lib/collections/tags/collection';
import Revisions from '../lib/collections/revisions/collection';
import ReadStatusesRepo from './repos/ReadStatusesRepo';
import Sequences from '../lib/collections/sequences/collection';
import UsersRepo from './repos/UsersRepo';
import { syncDocumentWithLatestRevision } from './editor/utils';
import { getCollection } from "../lib/vulcan-lib/getCollection";
import { createMutator, deleteMutator, updateMutator } from "./vulcan-lib/mutators";
import { createAdminContext, runQuery } from "./vulcan-lib/query";

getCollectionHooks("Messages").newAsync.add(async function updateConversationActivity (message: DbMessage) {
  // Update latest Activity timestamp on conversation when new message is added
  const user = await Users.findOne(message.userId);
  const conversation = await Conversations.findOne(message.conversationId);
  if (!conversation) throw Error(`Can't find conversation for message ${message}`)
  await updateMutator({
    collection: Conversations,
    documentId: conversation._id,
    set: {latestActivity: message.createdAt},
    currentUser: user,
    validate: false,
  });
});

getCollectionHooks("Users").editAsync.add(async function userEditChangeDisplayNameCallbacksAsync(user: DbUser, oldUser: DbUser) {
  // if the user is setting up their profile and their username changes from that form,
  // we don't want this action to count toward their one username change
  const isSettingUsername = oldUser.usernameUnset && !user.usernameUnset
  if (user.displayName !== oldUser.displayName && !isSettingUsername) {
    await updateMutator({
      collection: Users,
      documentId: user._id,
      set: {previousDisplayName: oldUser.displayName},
      currentUser: user,
      validate: false,
    });
  }
});

getCollectionHooks("Users").updateAsync.add(async function userEditDeleteContentCallbacksAsync({newDocument, oldDocument, currentUser}) {
  if (newDocument.nullifyVotes && !oldDocument.nullifyVotes) {
    await nullifyVotesForUser(newDocument);
  }
  if (newDocument.deleteContent && !oldDocument.deleteContent && currentUser) {
    void userDeleteContent(newDocument, currentUser);
  }
});

getCollectionHooks("Users").editAsync.add(function userEditBannedCallbacksAsync(user: DbUser, oldUser: DbUser) {
  const currentBanDate = user.banned
  const previousBanDate = oldUser.banned
  const now = new Date()
  const updatedUserIsBanned = !!(currentBanDate && new Date(currentBanDate) > now)
  const previousUserWasBanned = !!(previousBanDate && new Date(previousBanDate) > now)
  
  if (updatedUserIsBanned && !previousUserWasBanned) {
    void userIPBanAndResetLoginTokens(user);
  }
});

/**
 * Reverse the given vote, without triggering any karma change notifications
 */
export const silentlyReverseVote = async (vote: DbVote, context: ResolverContext) => {
  const collection = getCollection(vote.collectionName as VoteableCollectionName);
  const document = await collection.findOne({_id: vote.documentId});
  const user = await Users.findOne({_id: vote.userId});
  if (document && user) {
    await clearVotesServer({ document, collection, user, silenceNotification: true, context });
  } else {
    //eslint-disable-next-line no-console
    console.info("No item or user found corresponding to vote: ", vote, document, user);
  }
}

export const nullifyVotesForUser = async (user: DbUser) => {
  for (let collection of VoteableCollections) {
    await nullifyVotesForUserAndCollection(user, collection);
  }
}

interface DateRange {
  after?: Date;
  before?: Date;
}

export const nullifyVotesForUserByTarget = async (user: DbUser, targetUserId: string, dateRange: DateRange) => {
  for (let collection of VoteableCollections) {
    await nullifyVotesForUserAndCollectionByTarget(user, collection, targetUserId, dateRange);
  }
}

const nullifyVotesForUserAndCollection = async (user: DbUser, collection: CollectionBase<VoteableCollectionName>) => {
  const collectionName = capitalize(collection.collectionName);
  const context = createAdminContext();
  const votes = await Votes.find({
    collectionName: collectionName,
    userId: user._id,
    cancelled: false,
  }).fetch();
  for (let vote of votes) {
    //eslint-disable-next-line no-console
    console.log("reversing vote: ", vote)
    await silentlyReverseVote(vote, context);
  };
  //eslint-disable-next-line no-console
  console.info(`Nullified ${votes.length} votes for user ${user.username}`);
}

const nullifyVotesForUserAndCollectionByTarget = async (
  user: DbUser,
  collection: CollectionBase<VoteableCollectionName>,
  targetUserId: string,
  dateRange: DateRange,
) => {
  const collectionName = capitalize(collection.collectionName);
  const context = createAdminContext();
  const votes = await Votes.find({
    collectionName: collectionName,
    userId: user._id,
    cancelled: false,
    authorIds: targetUserId,
    power: { $ne: 0 },
    ...(dateRange.after ? { votedAt: { $gt: dateRange.after } } : {}),
    ...(dateRange.before ? { votedAt: { $lt: dateRange.before } } : {})
  }).fetch();
  for (let vote of votes) {
    const { documentId, collectionName, authorIds, extendedVoteType, power, cancelled, votedAt } = vote;
    //eslint-disable-next-line no-console
    console.log("reversing vote: ", { documentId, collectionName, authorIds, extendedVoteType, power, cancelled, votedAt });
    await silentlyReverseVote(vote, context);
  };
  //eslint-disable-next-line no-console
  console.info(`Nullified ${votes.length} votes for user ${user.username} in collection ${collectionName}`);
}

export async function userDeleteContent(user: DbUser, deletingUser: DbUser, deleteTags=true) {
  //eslint-disable-next-line no-console
  console.log("Deleting all content of user: ", user)
  const posts = await Posts.find({userId: user._id}).fetch();
  //eslint-disable-next-line no-console
  console.info("Deleting posts: ", posts);
  for (let post of posts) {
    await updateMutator({
      collection: Posts,
      documentId: post._id,
      set: {status: postStatuses.STATUS_DELETED},
      unset: {},
      currentUser: deletingUser,
      validate: false,
    })

    const notifications = await Notifications.find({documentId: post._id}).fetch();
    //eslint-disable-next-line no-console
    console.info(`Deleting notifications for post ${post._id}: `, notifications);
    for (let notification of notifications) {
      await deleteMutator({
        collection: Notifications,
        documentId: notification._id,
        validate: false,
      })
    }

    const reports = await Reports.find({postId: post._id}).fetch();
    //eslint-disable-next-line no-console
    console.info(`Deleting reports for post ${post._id}: `, reports);
    for (let report of reports) {
      await updateMutator({
        collection: Reports,
        documentId: report._id,
        set: {closedAt: new Date()},
        unset: {},
        currentUser: deletingUser,
        validate: false,
      })
    }
    
    await postReportPurgeAsSpam(post);
  }

  const comments = await Comments.find({userId: user._id}).fetch();
  //eslint-disable-next-line no-console
  console.info("Deleting comments: ", comments);
  for (let comment of comments) {
    if (!comment.deleted) {
      try {
        await updateMutator({
          collection: Comments,
          documentId: comment._id,
          set: {deleted: true, deletedDate: new Date()},
          unset: {},
          currentUser: deletingUser,
          validate: false,
        })
      } catch(err) {
        //eslint-disable-next-line no-console
        console.error("Failed to delete comment")
        //eslint-disable-next-line no-console
        console.error(err)
      }
    }

    const notifications = await Notifications.find({documentId: comment._id}).fetch();
    //eslint-disable-next-line no-console
    console.info(`Deleting notifications for comment ${comment._id}: `, notifications);
    for (let notification of notifications) {
      await deleteMutator({ // TODO: This should be a soft-delete not a hard-delete
        collection: Notifications,
        documentId: notification._id,
        validate: false,
      })
    }

    const reports = await Reports.find({commentId: comment._id}).fetch();
    //eslint-disable-next-line no-console
    console.info(`Deleting reports for comment ${comment._id}: `, reports);
    for (let report of reports) {
      await updateMutator({
        collection: Reports,
        documentId: report._id,
        set: {closedAt: new Date()},
        unset: {},
        currentUser: deletingUser,
        validate: false,
      })
    }

    await commentReportPurgeAsSpam(comment);
  }
  
  const sequences = await Sequences.find({userId: user._id}).fetch();
  //eslint-disable-next-line no-console
  console.info("Deleting sequences: ", sequences);
  for (let sequence of sequences) {
    await updateMutator({
      collection: Sequences,
      documentId: sequence._id,
      set: {isDeleted: true},
      unset: {},
      currentUser: deletingUser,
      validate: false,
    })
  }
  
  if (deleteTags) {
    await deleteUserTagsAndRevisions(user, deletingUser)
  }

  //eslint-disable-next-line no-console
  console.info("Deleted n posts and m comments: ", posts.length, comments.length);
}

async function deleteUserTagsAndRevisions(user: DbUser, deletingUser: DbUser) {
  const tags = await Tags.find({userId: user._id}).fetch()
  // eslint-disable-next-line no-console
  console.info("Deleting tags: ", tags)
  for (let tag of tags) {
    if (!tag.deleted) {
      try {
        await updateMutator({
          collection: Tags,
          documentId: tag._id,
          set: {deleted: true},
          currentUser: deletingUser,
          validate: false
        })
      } catch(err) {
        // eslint-disable-next-line no-console
        console.error("Failed to delete tag")
        // eslint-disable-next-line no-console
        console.error(err)
      }
    }
  }
  
  const tagRevisions = await Revisions.find({userId: user._id, collectionName: 'Tags'}).fetch()
  // eslint-disable-next-line no-console
  console.info("Deleting tag revisions: ", tagRevisions)
  await Revisions.rawRemove({userId: user._id})
  // Revert revision documents
  for (let revision of tagRevisions) {
    if (!revision.collectionName) {
      continue;
    }
    const collection = getCollection(revision.collectionName);
    const document = await collection.findOne({_id: revision.documentId})
    if (document && revision.fieldName) {
      await syncDocumentWithLatestRevision(
        collection,
        document,
        revision.fieldName
      )
    }
  }
}

/**
 * Add user IP address to IP ban list for a day and remove their login tokens
 *
 * NB: We haven't tested the IP ban list in like 3 years and it should not be
 * assumed to work.
 */
export async function userIPBanAndResetLoginTokens(user: DbUser) {
  // IP ban
  const query = `
    query UserIPBan($userId:String) {
      user(input:{selector: {_id: $userId}}) {
        result {
          IPs
        }
      }
    }
  `;
  const IPs: any = await runQuery(query, {userId: user._id});
  if (IPs) {
    await asyncForeachSequential(IPs.data.user.result.IPs as Array<string>, async ip => {
      let tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const ban: Partial<DbBan> = {
        expirationDate: tomorrow,
        userId: user._id,
        reason: "User account banned",
        comment: "Automatic IP ban",
        ip: ip,
      }
      await createMutator({
        collection: Bans,
        document: ban,
        currentUser: user,
        validate: false,
      })
    })
  }

  // Remove login tokens
  await new UsersRepo().clearLoginTokens(user._id);
}


getCollectionHooks("LWEvents").newSync.add(async function updateReadStatus(event: DbLWEvent) {
  if (event.userId && event.documentId && event.name === "post-view") {
    // Upsert. This operation is subtle and fragile! We have a unique index on
    // (postId,userId,tagId). If two copies of a page-view event fire at the
    // same time, this creates a race condition. In order to not have this throw
    // an exception, we need to meet the conditions in
    //   https://docs.mongodb.com/manual/core/retryable-writes/#retryable-update-upsert
    // In particular, this means the selector has to exactly match the unique
    // index's keys.
    //
    // EDIT 2022-09-16: This is still the case in postgres ^
    const readStatus = await new ReadStatusesRepo().upsertReadStatus(event.userId, event.documentId, true);
  }
  return event;
});
