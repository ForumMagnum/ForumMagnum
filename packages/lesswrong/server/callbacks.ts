import { Votes } from '../server/collections/votes/collection';
import { getVoteableCollections } from '@/server/collections/allCollections';
import { capitalize } from '../lib/vulcan-lib/utils';
import { silentlyReverseVote } from './voteServer';
import { createAdminContext } from "./vulcan-lib/createContexts";

interface DateRange {
  after?: Date;
  before?: Date;
}

export const nullifyVotesForUserByTarget = async (user: DbUser, targetUserId: string, dateRange: DateRange) => {
  for (let collection of getVoteableCollections()) {
    await nullifyVotesForUserAndCollectionByTarget(user, collection, targetUserId, dateRange);
  }
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
