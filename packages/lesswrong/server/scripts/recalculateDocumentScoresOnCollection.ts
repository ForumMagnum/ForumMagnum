import { executePromiseQueue } from "@/lib/utils/asyncUtils";
import { getCollection } from "../collections/allCollections";
import { forEachDocumentBatchInCollection } from "../manualMigrations/migrationUtils";
import { recalculateDocumentScores } from "../voteServer";
import { createAnonymousContext } from "../vulcan-lib/createContexts";

export async function recalculateDocumentScoresOnCollection(collectionName: VoteableCollectionName) {
  const context = createAnonymousContext();
  await forEachDocumentBatchInCollection({
    collection: getCollection(collectionName),
    callback: async (batch) => {
      await executePromiseQueue(batch.map(doc => async () => {
        await recalculateDocumentScores(doc, collectionName, context)
      }), 5);
    },
  });
}