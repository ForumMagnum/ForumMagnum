/*
 * Review vote tallying: aggregates individual review votes into per-post
 * score fields on the Posts collection.
 *
 * Used by the cron job at `app/api/cron/update-review-vote-totals/route.ts`
 * and can also be run manually:
 *   yarn repl prod packages/lesswrong/server/reviewVoteUpdate.ts 'updateReviewVoteTotals("finalVote")'
 */

import ReviewVotes from "@/server/collections/reviewVotes/collection";
import Users from "@/server/collections/users/collection";
import { getCostData, REVIEW_YEAR } from "@/lib/reviewUtils";
import groupBy from 'lodash/groupBy';
import { Posts } from '@/server/collections/posts/collection';
import { userBigVotePower } from "@/lib/voting/voteTypes";

type ReviewVotePhase = 'nominationVote' | 'finalVote'

function getCost(vote: DbReviewVote): number {
  return getCostData({})[vote.qualitativeScore].cost;
}

function getValue(vote: DbReviewVote, total: number): number | null {
  return getCostData({costTotal: total})[vote.qualitativeScore].value;
}

function accumulateVoteForPost(
  postList: Record<string, Array<number>>,
  vote: DbReviewVote,
  total: number,
  user?: DbUser
) {
  const value = getValue(vote, total);
  if (value === null) return;
  const votePower = user ? userBigVotePower(user.karma ?? 0, 1) : 1;
  const finalValue = value * votePower;
  if (postList[vote.postId] === undefined) {
    postList[vote.postId] = [finalValue];
  } else {
    postList[vote.postId].push(finalValue);
  }
}

// Takes grouped review votes and writes aggregated score fields onto Post records.
// Sorts vote values descending, computes total score, and writes both to the
// given fields on each Post.
async function writeVoteResultsToDb(
  voteValuesByPost: Record<string, number[]>,
  votesFieldName: string,
  scoreFieldName: string,
  label: string
) {
  for (const postId in voteValuesByPost) {
    // eslint-disable-next-line no-console
    console.log(`Updating ${label} vote totals`, postId);
    const sortedVotes = voteValuesByPost[postId].sort((a, b) => b - a);
    const totalScore = sortedVotes.reduce((sum, v) => sum + v, 0);
    await Posts.rawUpdateOne({_id: postId}, {$set: {
      [votesFieldName]: sortedVotes,
      [scoreFieldName]: totalScore,
    }});
  }
}

async function updateVoteTotals(
  usersByUserId: Record<string, DbUser[]>,
  votesByUserId: Record<string, DbReviewVote[]>,
  votePhase: ReviewVotePhase,
  postIds: Array<string>
) {
  // Phase 1: Accumulate per-post vote values from each user's votes.
  // We compute two parallel maps: one with raw vote values (all users weighted
  // equally), and one where votes are multiplied by the user's strong-vote power.
  const postsAllUsers: Record<string, number[]> = {};
  const postsHighKarmaUsers: Record<string, number[]> = {};

  for (const userId of Object.keys(votesByUserId)) {
    const user = usersByUserId[userId][0];
    const userVotes = votesByUserId[userId];

    // In the finalVote phase, only votes on posts that received reviews count
    // toward the user's cost total (for quadratic voting normalization).
    const eligibleVotes = votePhase === 'finalVote'
      ? userVotes.filter(vote => postIds.includes(vote.postId))
      : userVotes;
    const costTotal = eligibleVotes.reduce((total, vote) => total + getCost(vote), 0);

    for (const vote of userVotes) {
      if (!vote.qualitativeScore) continue;
      accumulateVoteForPost(postsAllUsers, vote, costTotal);
      accumulateVoteForPost(postsHighKarmaUsers, vote, costTotal, user);
    }
  }

  // Phase 2: Write aggregated results to Post records.
  const isNomination = votePhase === 'nominationVote';

  await writeVoteResultsToDb(
    postsAllUsers,
    isNomination ? 'reviewVotesAllKarma' : 'finalReviewVotesAllKarma',
    isNomination ? 'reviewVoteScoreAllKarma' : 'finalReviewVoteScoreAllKarma',
    "All Users"
  );
  await writeVoteResultsToDb(
    postsHighKarmaUsers,
    isNomination ? 'reviewVotesHighKarma' : 'finalReviewVotesHighKarma',
    isNomination ? 'reviewVoteScoreHighKarma' : 'finalReviewVoteScoreHighKarma',
    "High Karma Users"
  );

  // eslint-disable-next-line no-console
  console.log("finished updating review vote totals");
}

export async function updateReviewVoteTotals(votePhase: ReviewVotePhase) {
  const votes = await ReviewVotes.find({year: REVIEW_YEAR + ""}).fetch();

  // Group each user's votes so we can weight them appropriately
  // based on the user's vote cost total.
  const votesByUserId = groupBy(votes, vote => vote.userId);

  // Fetch all users who have cast one or more votes
  const users = await Users.find({_id: {$in: Object.keys(votesByUserId)}}).fetch();
  const usersByUserId = groupBy(users, user => user._id);

  if (votePhase === "nominationVote") {
    await updateVoteTotals(usersByUserId, votesByUserId, votePhase, []);
  }
  if (votePhase === "finalVote") {
    const posts = await Posts.find({reviewCount: {$gte: 1}}).fetch();
    const postIds = posts.map(post => post._id);
    await updateVoteTotals(usersByUserId, votesByUserId, votePhase, postIds);
  }
}
