import { migrateDocuments } from "../manualMigrations/migrationUtils";
import { Users } from '../../lib/collections/users/collection';
import { Votes } from "../../lib/collections/votes/collection";
import { collectionsThatAffectKarma } from "../callbacks/votingCallbacks";
import { Globals } from "../../lib/vulcan-lib/config";
import { filterWhereFieldsNotNull } from "../../lib/utils/typeGuardUtils";

type UserVoteFields = {
  voteReceivedCount: number;
  smallUpvoteReceivedCount: number;
  smallDownvoteReceivedCount: number;
  bigUpvoteReceivedCount: number;
  bigDownvoteReceivedCount: number;
}

const DEFAULT_USER_VOTE_FIELDS: UserVoteFields = {
  voteReceivedCount: 0,
  smallUpvoteReceivedCount: 0,
  smallDownvoteReceivedCount: 0,
  bigUpvoteReceivedCount: 0,
  bigDownvoteReceivedCount: 0
}

/**
 * Recalculates the following fields on the Users table for all users, related to how many votes they've received:
 *
 * voteReceivedCount
 * smallUpvoteReceivedCount
 * bigUpvoteReceivedCount
 * smallDownvoteReceivedCount
 * bigDownvoteReceivedCount
 */
async function recalculateReceivedVoteCounts() {
  await migrateDocuments({
    collection: Users,
    batchSize: 100,
    migrate: async (users) => {
      const userIds = users.map(user => user._id)
      // get all the votes on the given batch of users,
      // ignoring votes on collections that don't affect karma
      const userVotes = await Votes.find({
        authorIds: { $in: userIds },
        cancelled: { $ne: true },
        voteType: { $ne: 'neutral' },
        collectionName: { $in: collectionsThatAffectKarma }
      }).fetch();
      // filter out votes that are self votes
      const filteredUserVotes = userVotes.filter(vote => !vote.authorIds?.includes(vote.userId));
      const userIdSet = new Set(userIds);

      // calculate the vote received counts for each user in the batch
      const batchUserVoteCounts = filteredUserVotes.reduce((agg, vote) => {
        // make sure to only make changes to users in the *current* batch
        // (ex. we ignore other post authors since we didn't get all their received votes above)
        const authorsInBatch = vote.authorIds?.filter(authorId => userIdSet.has(authorId)) ?? [];

        // update each vote author (i.e. the users who received the vote)
        authorsInBatch.forEach(authorId => {
          const voteCounts = agg[authorId] ?? { ...DEFAULT_USER_VOTE_FIELDS };
          switch (vote.voteType) {
            case 'smallUpvote':
              voteCounts.smallUpvoteReceivedCount++;
              break;
            case 'smallDownvote':
              voteCounts.smallDownvoteReceivedCount++;
              break;
            case 'bigUpvote':
              voteCounts.bigUpvoteReceivedCount++;
              break;
            case 'bigDownvote':
              voteCounts.bigDownvoteReceivedCount++;
              break;
            case 'neutral': // We weren't previously counting neutral votes when I added this to fix types. I don't think we need to start, but, flagging the inconsistency.
              break;
          }
          voteCounts.voteReceivedCount++;

          agg[authorId] = voteCounts;
        });

        return agg;
      }, {} as Record<string, UserVoteFields>);

      const batchUpdates = Object.entries(batchUserVoteCounts).map(([userId, voteCounts]) => {
        return {
          updateOne: {
            filter: {_id: userId},
            update: {
              $set: { ...voteCounts }
            },
          }
        }
      });

      if (batchUpdates.length > 0) {
        // eslint-disable-next-line no-console
        console.log(`Updating batch of ${batchUpdates.length} users, _id of first user is ${batchUpdates[0].updateOne.filter._id}`);
        await Users.rawCollection().bulkWrite(
          batchUpdates,
          { ordered: false }
        );
      }
    }
  })
}

Globals.recalculateReceivedVoteCounts = recalculateReceivedVoteCounts;
