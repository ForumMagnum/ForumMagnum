/* eslint-disable no-console */
import Votes from "../collections/votes/collection";
import uniq from "lodash/uniq";
import { createAdminContext } from "../vulcan-lib/createContexts";
import { getCollection } from "../collections/allCollections";
import { performVoteServer } from "../voteServer";

/**
 * Undo the effects of an april fools joke which caused users to temporarily
 * have weird voting strengths, by cancelling and re-casting votes during
 * the relevant time range.
 */
export async function resetVoteStrengths({startDate, endDate}: {
  startDate: Date,
  endDate: Date
}) {
  // Find potentially affected votes
  const potentiallyAffectedVotes = await Votes.find({
    votedAt: {
      $gt: startDate,
      $lt: endDate,
    },
    cancelled: false,
  }).fetch();
  const userIdsWhoVoted = uniq(potentiallyAffectedVotes.map(v => v.userId))
  console.log(`Recalculating ${potentiallyAffectedVotes.length} votes by ${userIdsWhoVoted.length} users`);
  
  const resolverContext = createAdminContext();
  for (const vote of potentiallyAffectedVotes) {
    await recastVote(vote, resolverContext);
  }
}

async function recastVote(vote: DbVote, context: ResolverContext) {
  const collectionName = vote.collectionName as VoteableCollectionName;
  const collection = getCollection(collectionName);
  const user = await context.loaders.Users.load(vote.userId)!;

  const { vote: createdVote, modifiedDocument } = await performVoteServer({
    documentId: vote.documentId,
    voteType: vote.voteType,
    extendedVote: vote.extendedVoteType,
    collection,
    user,
    toggleIfAlreadyVoted: false,
    skipRateLimits: true,
    context,
    selfVote: vote.authorIds?.includes(vote.userId),
  });
  
  // Back-date the recreated vote to the timestamp of the vote it replaced, so
  // that users who have their votes recast don't immediately becoem rate-limited
  // on voting
  await Votes.rawUpdateOne(
    {_id: createdVote!._id},
    {$set: {
      createdAt: vote.createdAt,
      votedAt: vote.votedAt,
    }},
  );
}
