import Users from '../../lib/collections/users/collection';
import { Posts } from '../../lib/collections/posts/collection';
import { voteCallbacks, VoteDocTuple } from '../../lib/voting/vote';
import { postPublishedCallback } from '../notificationCallbacks';
import { batchUpdateScore } from '../updateScores';

const collectionsThatAffectKarma = ["Posts", "Comments", "Revisions"];

const usersVoteAppliesTo = (newDocument: DbVoteableType, vote: DbVote): string[] => {
  // do not update if the voting user is the author or one of the co-authors
  const userIds: string[] = [newDocument.userId].concat(newDocument.coauthorUserIds || []);
  if (userIds.includes(vote.userId) || !collectionsThatAffectKarma.includes(vote.collectionName)) return [];

  return userIds;
}

/**
 * Share karma among users, giving each user `karma/sqrt(numUsers)`
 * @param userIds 
 * @param karma 
 */
const applyKarmaToUsers = (userIds: string[], karma: number): void => {
  if (userIds.length === 0) return;

  // round "away from zero" to be generous (and to simplify making votes reversible)
  const roundFunc = karma > 0 ? Math.ceil : Math.floor
  const appliedKarma = roundFunc(karma / Math.sqrt(userIds.length));
  void Users.rawUpdateMany({ _id: {$in: userIds} }, {$inc: {"karma": appliedKarma}});
}

const updateVoteCount = (newDocument: DbVoteableType, vote: DbVote, increment: number): void => {
  if (usersVoteAppliesTo(newDocument, vote).length === 0) return;

  const field = vote.voteType + "Count";
  void Users.rawUpdateOne({_id: vote.userId}, {$inc: {[field]: increment, voteCount: increment}});
}

// update user karma
voteCallbacks.castVoteAsync.add(({newDocument, vote}: VoteDocTuple) => applyKarmaToUsers(usersVoteAppliesTo(newDocument, vote), vote.power));
voteCallbacks.cancelAsync.add(({newDocument, vote}: VoteDocTuple) => applyKarmaToUsers(usersVoteAppliesTo(newDocument, vote), -vote.power));

// update user vote counts
// NOTE: currently this has the slightly confusing behaviour that if you upvote a post, and then cancel that upvote, your overall vote count is increased by 1
// (the initial upvote gives +1, the cancelled upvote gives -1, and a "neutral" vote is added with +1)
voteCallbacks.castVoteAsync.add(({newDocument, vote}: VoteDocTuple) => updateVoteCount(newDocument, vote, 1));
voteCallbacks.cancelAsync.add(({newDocument, vote}: VoteDocTuple) => updateVoteCount(newDocument, vote, -1));

voteCallbacks.castVoteAsync.add(async function updateNeedsReview (document: VoteDocTuple) {
  const voter = await Users.findOne(document.vote.userId);
  // voting should only be triggered once (after getting snoozed, they will not re-trigger for sunshine review)
  if (voter && voter.voteCount >= 20 && !voter.reviewedByUserId) {
    void Users.rawUpdateOne({_id:voter._id}, {$set:{needsReview: true}})
  }
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
