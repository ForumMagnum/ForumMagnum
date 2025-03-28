import { createAnonymousContext } from "../vulcan-lib/createContexts";
import { forEachDocumentBatchInCollection, registerMigration } from "./migrationUtils";
import { dataToWordCount } from "@/server/editor/conversionUtils";

export default registerMigration({
  name: "fillMissingWordCounts",
  dateWritten: "2024-08-29",
  idempotent: true,
  action: async () => {
    const context = createAnonymousContext();
    const { Revisions } = context;
    const totalCount = await Revisions.find({wordCount: {$exists: false}}).count();
    const batchSize = 500;
    const totalBatches = Math.ceil(totalCount / batchSize);
    let batch = 0;
    await forEachDocumentBatchInCollection({
      collection: Revisions,
      batchSize,
      filter: {wordCount: {$exists: false}},
      callback: async (revisions: DbRevision[]) => {
        // eslint-disable-next-line no-console
        console.log(`Backfilling revision batch ${++batch} of ${totalBatches}`);

        const updates: MongoBulkWriteOperations<DbRevision> = [];
        for (const revision of revisions) {
          const {data, type} = revision.originalContents ?? {};
          const wordCount = data && type
            ? await dataToWordCount(data, type, context)
            : 0;
          updates.push({
            updateOne: {
              filter: {
                _id: revision._id,
              },
              update: {
                $set: {
                  wordCount,
                },
              },
            },
          });
        }
        await Revisions.rawCollection().bulkWrite(updates, {ordered: false});
      },
    });
  },
});
