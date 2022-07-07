import { registerMigration, forEachDocumentBatchInCollection } from './migrationUtils';
import Votes from '../../lib/collections/votes/collection';

registerMigration({
  name: "allowMultipleVoteAuthors",
  dateWritten: "2022-07-07",
  idempotent: true,
  action: async () => {
    await forEachDocumentBatchInCollection({
      collection: Votes,
      batchSize: 100,
      filter: {
        authorIds: { $exists: false },
      },
      callback: async (votes: Array<DbVote>) => {
        // eslint-disable-next-line no-console
        console.log("Migrating vote batch");
        // @ts-ignore
        const changes = votes.map(({ _id, authorId }) => ({
          updateOne: {
            filter: { _id },
            update: { $set: {authorIds: authorId ? [authorId] : [] } },
          }
        }));
        await Votes.rawCollection().bulkWrite(changes, { ordered: false });
      }
    });
  },
});
