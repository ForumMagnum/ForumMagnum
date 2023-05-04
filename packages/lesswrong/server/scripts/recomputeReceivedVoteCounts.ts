import { migrateDocuments } from "../manualMigrations/migrationUtils";
import { Users } from '../../lib/collections/users/collection';
import { Votes } from "../../lib/collections/votes";
import { collectionsThatAffectKarma } from "../callbacks/votingCallbacks";
import { Globals } from "../vulcan-lib";

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
};

async function recalculateReceivedVoteCounts() {
  await migrateDocuments({
    collection: Users,
    batchSize: 100,
    migrate: async (users) => {
      const userIds = users.map(user => user._id);
      const userVotes = await Votes.find({
        authorIds: { $in: userIds },
        cancelled: { $ne: true },
        collectionName: { $in: collectionsThatAffectKarma }
      }).fetch();

      const filteredUserVotes = userVotes.filter(vote => !vote.authorIds.includes(vote.userId));
      const userIdSet = new Set(userIds);

      const batchUserVoteCounts = filteredUserVotes.reduce((agg, vote) => {
        const authorsInBatch = vote.authorIds.filter(authorId => userIdSet.has(authorId));

        authorsInBatch.forEach(authorId => {
          const previousAuthorVoteCounts = agg[authorId] ?? { ...DEFAULT_USER_VOTE_FIELDS };
          switch (vote.voteType) {
            case 'smallUpvote':
              previousAuthorVoteCounts.smallUpvoteReceivedCount++;
              break;
            case 'smallDownvote':
              previousAuthorVoteCounts.smallDownvoteReceivedCount++;
              break;
            case 'bigUpvote':
              previousAuthorVoteCounts.bigUpvoteReceivedCount++;
              break;
            case 'bigDownvote':
              previousAuthorVoteCounts.bigDownvoteReceivedCount++;
              break;
          }
          previousAuthorVoteCounts.voteReceivedCount++;

          agg[authorId] = previousAuthorVoteCounts;
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
        console.log({ batchSize: batchUpdates.length, firstUserId: batchUpdates[0].updateOne.filter._id });
        await Users.rawCollection().bulkWrite(
          batchUpdates,
          { ordered: false }
        );
      }
    }
  })
}

Globals.recalculateReceivedVoteCounts = recalculateReceivedVoteCounts;
