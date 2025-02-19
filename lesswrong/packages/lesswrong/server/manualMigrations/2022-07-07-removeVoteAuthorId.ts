import { registerMigration, forEachDocumentBatchInCollection } from './migrationUtils';
import Votes from '../../lib/collections/votes/collection';

registerMigration({
  name: "removeVoteAuthorId",
  dateWritten: "2022-07-07",
  idempotent: true,
  action: async () => {
    await forEachDocumentBatchInCollection({
      collection: Votes,
      batchSize: 1000,
      filter: {
        authorId: { $exists: true },
        authorIds: { $exists: true },
      },
      callback: async (votes: Array<DbVote>) => {
        // eslint-disable-next-line no-console
        console.log("Migrating vote batch");
        const changes = votes.map(({ _id }) => {
          return {
            updateOne: {
              filter: { _id },
              update: {$unset: {authorId: ""}}
            }
          };
        });
        await Votes.rawCollection().bulkWrite(changes, { ordered: false });
      }
    });
  },
});
