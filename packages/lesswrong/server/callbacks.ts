import { Votes } from '../server/collections/votes/collection';
import { getVoteableCollections } from '@/server/collections/allCollections';
import { capitalize } from '../lib/vulcan-lib/utils';
import { silentlyReverseVote } from './voteServer';
import { getCollectionHooks } from './mutationCallbacks';
import ReadStatusesRepo from './repos/ReadStatusesRepo';
import { createAdminContext } from "./vulcan-lib/query";

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
