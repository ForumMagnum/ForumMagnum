import { registerMigration, forEachDocumentBatchInCollection } from './migrationUtils';
import { Revisions } from '../../lib/collections/revisions/collection';

registerMigration({
  name: "selfVoteOnTagRevisions",
  dateWritten: "2021-05-09",
  idempotent: true,
  action: async () => {
    await forEachDocumentBatchInCollection({
      collection: Revisions,
      batchSize: 50,
      filter: {collectionName: "Tags", fieldName: "description"},
      callback: async (revisions: DbRevision[]) => {
        // TODO
      }
    });
  }
});
