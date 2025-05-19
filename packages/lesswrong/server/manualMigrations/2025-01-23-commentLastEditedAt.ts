import { executePromiseQueue } from "../../lib/utils/asyncUtils";
import { forEachDocumentBatchInCollection, registerMigration } from "./migrationUtils";
import { Comments } from "@/server/collections/comments/collection";
import Revisions from "@/server/collections/revisions/collection";

export default registerMigration({
  name: "commentLastEditedAt",
  dateWritten: "2025-02-23",
  idempotent: true,
  action: async () => {
    await forEachDocumentBatchInCollection({
      collection: Comments,
      batchSize: 500,
      callback: async (comments: DbComment[]) => {
        await executePromiseQueue(comments.map(c => async () => {
          // Get the last rev, excluding revs that didn't change anything, and copy its datestamp onto lastEditedAt
          const lastRev = await Revisions.findOne(
            {
              documentId: c._id,
              fieldName: "contents",
              $or: [
                {"changeMetrics.added": {$gt: 0}},
                {"changeMetrics.removed": {$gt: 0}}
              ],
            },
            {sort: {editedAt: -1}}
          )
          if (lastRev) {
            await Comments.rawUpdateOne(
              {_id: c._id},
              {$set: {
                lastEditedAt: lastRev.editedAt,
              }},
            );
          }
        }), 10);
      },
    });
  },
});
