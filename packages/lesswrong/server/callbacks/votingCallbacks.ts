import pick from 'lodash/pick';
import { Posts } from '../../lib/collections/posts/collection';
import Users from '../../lib/collections/users/collection';
import { isLWorAF } from '../../lib/instanceSettings';
import { eaPublicEmojiNames } from '../../lib/voting/eaEmojiPalette';
import { voteCallbacks, VoteDocTuple } from '../../lib/voting/vote';
import { postPublishedCallback } from '../notificationCallbacks';
import { createNotifications } from '../notificationCallbacksHelpers';
import { checkForStricterRateLimits } from '../rateLimitUtils';
import { batchUpdateScore } from '../updateScores';
import { triggerCommentAutomodIfNeeded } from "./sunshineCallbackUtils";
import Votes from '../../lib/collections/votes/collection';
import { getConfirmedCoauthorIds } from '../../lib/collections/posts/helpers';

/**
 * @summary Update the karma of the item's owner
 * @param {object} item - The item being operated on
 * @param {object} user - The user doing the operation
 * @param {object} collection - The collection the item belongs to
 * @param {string} operation - The operation being performed
 */
export const collectionsThatAffectKarma = ["Posts", "Comments", "Revisions"]
voteCallbacks.castVoteAsync.add(async function updateKarma({newDocument, vote}: VoteDocTuple, collection: CollectionBase<DbVoteableType>, user: DbUser, context) {
  // Only update user karma if the operation isn't done by one of the item's current authors.
  // We don't want to let any of the authors give themselves or another author karma for this item.
  // We need to await it so that the subsequent check for whether any stricter rate limits apply can do a proper comparison between old and new karma
  if (!vote.authorIds.includes(vote.userId) && collectionsThatAffectKarma.includes(vote.collectionName)) {
    await Users.rawUpdateMany({_id: {$in: vote.authorIds}}, {$inc: {karma: vote.power}});
  }

  if (isLWorAF && ['Posts', 'Comments'].includes(vote.collectionName)) {
    void checkForStricterRateLimits(newDocument.userId, context);
  }
});

voteCallbacks.cancelAsync.add(function cancelVoteKarma({newDocument, vote}: VoteDocTuple, collection: CollectionBase<DbVoteableType>, user: DbUser) {
  // Only update user karma if the operation isn't done by one of the item's authors at the time of the original vote.
  // We expect vote.authorIds here to be the same as the authorIds of the original vote.
  if (!vote.authorIds.includes(vote.userId) && collectionsThatAffectKarma.includes(vote.collectionName)) {
    void Users.rawUpdateMany({_id: {$in: vote.authorIds}}, {$inc: {karma: -vote.power}});
  }
});


voteCallbacks.castVoteAsync.add(async function incVoteCount ({newDocument, vote}: VoteDocTuple) {
  if (vote.voteType === "neutral") {
    return;
  }

  // Increment the count for the person casting the vote
  const casterField = `${vote.voteType}Count`

  if (newDocument.userId !== vote.userId) {
    void Users.rawUpdateOne({_id: vote.userId}, {$inc: {[casterField]: 1, voteCount: 1}});
  }

  // Increment the count for the person receiving the vote
  const receiverField = `${vote.voteType}ReceivedCount`

  if (newDocument.userId !== vote.userId) {
    // update all users in vote.authorIds
    void Users.rawUpdateMany({_id: {$in: vote.authorIds}}, {$inc: {[receiverField]: 1, voteReceivedCount: 1}});
  }
});

voteCallbacks.cancelAsync.add(async function cancelVoteCount ({newDocument, vote}: VoteDocTuple) {
  if (vote.voteType === "neutral") {
    return;
  }

  const casterField = `${vote.voteType}Count`

  if (newDocument.userId !== vote.userId) {
    void Users.rawUpdateOne({_id: vote.userId}, {$inc: {[casterField]: -1, voteCount: -1}});
  }

  // Increment the count for the person receiving the vote
  const receiverField = `${vote.voteType}ReceivedCount`

  if (newDocument.userId !== vote.userId) {
    // update all users in vote.authorIds
    void Users.rawUpdateMany({_id: {$in: vote.authorIds}}, {$inc: {[receiverField]: -1, voteReceivedCount: -1}});
  }
});

voteCallbacks.castVoteAsync.add(async function checkAutomod ({newDocument, vote}: VoteDocTuple, collection, user, context) {
  if (vote.collectionName === 'Comments') {
    void triggerCommentAutomodIfNeeded(newDocument, vote);
  }
});

voteCallbacks.castVoteAsync.add(async function createReactionNotifications ({newDocument, vote}: VoteDocTuple, collection, user, context) {
  // Currently, reactions are only relevant to votes on posts and comments
  if (!['Posts', 'Comments'].includes(vote.collectionName)) return
  
  const eaEmojiVotes = pick(vote.extendedVoteType, eaPublicEmojiNames)
  // Only create a notification if this is the user's first non-anonymous EA reaction on this document
  if (Object.keys(eaEmojiVotes).length !== 1) return
  
  // Only create a notification if this is a vote and not an unvote
  const reaction = Object.keys(eaEmojiVotes)[0]
  if (!eaEmojiVotes[reaction]) return
  
  // Only create a notification if we haven't already accounted for this reaction
  const prevVote = await Votes.findOne({
    documentId: newDocument._id,
    userId: vote.userId,
    cancelled: true,
  }, {
    sort: {votedAt: -1},
  })
  if (prevVote?.extendedVoteType[reaction]) return
  
  const coauthorIds = vote.collectionName === 'Posts' ? getConfirmedCoauthorIds(newDocument as DbPost) : []
  const userIds = [newDocument.userId, ...coauthorIds]
  // Don't notify the user if they voted on their own document
  if (userIds.includes(vote.userId)) return
  
  const documentType = vote.collectionName === 'Posts' ? 'post' : 'comment'
  void createNotifications({
    userIds,
    notificationType: 'newReaction',
    documentType,
    documentId: newDocument._id,
    noEmail: true,
    context
  })
});


postPublishedCallback.add(async (publishedPost: DbPost) => {
  // When a post is published (undrafted), update its score. (That is, recompute
  // the time-decaying score used for sorting, since the time that's computed
  // relative to has just changed).
  //
  // To do this, we mark it `inactive:false` and update the scores on the
  // whole collection. (This is already something being done frequently by a
  // cronjob.)
  if (publishedPost.inactive) {
    await Posts.rawUpdateOne({_id: publishedPost._id}, {$set: {inactive: false}});
  }
  
  await batchUpdateScore({collection: Posts});
});
