import { registerMigration, forEachDocumentBatchInCollection } from './migrationUtils';
import Revisions from '../../lib/collections/revisions/collection'
import { getPrecedingRev, htmlToChangeMetrics } from '../editor/utils';

registerMigration({
  name: "revisionChangeMetrics",
  dateWritten: "2020-09-15",
  idempotent: true,
  action: async () => {
    await forEachDocumentBatchInCollection({
      collection: Revisions,
      filter: {changeMetrics: {$exists: false}},
      batchSize: 1000,
      callback: async (revisions: Array<DbRevision>) => {
        const changes: Array<any> = [];
        await Promise.all(revisions.map(async (rev: DbRevision) => {
          const previousRev = await getPrecedingRev(rev);
          const changeMetrics = htmlToChangeMetrics(previousRev?.html || "", rev.html||"");
          changes.push({
            updateOne: {
              filter: { _id: rev._id },
              update: { $set: { changeMetrics } },
            }
          });
        }));
        await Revisions.rawCollection().bulkWrite(changes, { ordered: false });
      }
    });
  }
});
