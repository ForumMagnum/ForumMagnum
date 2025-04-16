import { executePromiseQueue } from "@/lib/utils/asyncUtils";
import { getCollection } from "../collections/allCollections";
import { forEachDocumentBatchInCollection } from "../manualMigrations/migrationUtils";
import { recalculateDocumentScores } from "../voteServer";
import { createAnonymousContext } from "../vulcan-lib/createContexts";

export async function recalculateDocumentScoresOnCollection(collectionName: VoteableCollectionName) {
  const collection = getCollection(collectionName);
  const context = createAnonymousContext();
  await forEachDocumentBatchInCollection({
    collection: collection,
    batchSize: 100,
    callback: async (batch) => {
      await executePromiseQueue(batch.map(doc => async () => {
        const newScore = await recalculateDocumentScores(doc, collectionName, context)
        const { baseScore, voteCount, afVoteCount, score, extendedScore, afExtendedScore } = newScore;
        await collection.rawUpdateOne(
          { _id: doc._id },
          {$set: {
            baseScore, voteCount, afVoteCount, score, extendedScore, afExtendedScore
          }},
        );
      }), 5);
    },
  });
  // eslint-disable-next-line no-console
  console.log("Done");
}
