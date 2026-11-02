import { executePromiseQueue } from "@/lib/utils/asyncUtils";
import { forEachDocumentBatchInCollection, registerMigration } from "./migrationUtils";
import Revisions from "@/server/collections/revisions/collection";
import { createAnonymousContext } from "@/server/vulcan-lib/createContexts";
import { getPrecedingRev, htmlToChangeMetrics } from "@/server/editor/utils";

// Wiki revisions that only changed links were stored with 0/0 changeMetrics,
// which hides their diffs on tag history pages.
async function recomputeChangeMetrics(revision: DbRevision, context: ResolverContext) {
  const previousRevision = await getPrecedingRev(revision, context);
  if (!previousRevision) {
    return;
  }
  const changeMetrics = htmlToChangeMetrics(previousRevision.html ?? "", revision.html ?? "");
  if (changeMetrics.added === 0 && changeMetrics.removed === 0) {
    return;
  }
  await Revisions.rawUpdateOne({ _id: revision._id }, { $set: { changeMetrics } });
}

export default registerMigration({
  name: "recomputeLinkOnlyChangeMetrics",
  dateWritten: "2026-11-02",
  idempotent: true,
  action: async () => {
    const context = createAnonymousContext();
    await forEachDocumentBatchInCollection({
      collection: Revisions,
      batchSize: 500,
      filter: {
        collectionName: { $in: ["Tags", "MultiDocuments"] },
        "changeMetrics.added": 0,
        "changeMetrics.removed": 0,
      },
      callback: async (revisions: DbRevision[]) => {
        await executePromiseQueue(revisions.map(revision => () => recomputeChangeMetrics(revision, context)), 10);
      },
    });
  },
});
