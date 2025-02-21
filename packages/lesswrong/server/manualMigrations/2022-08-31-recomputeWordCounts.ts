import { registerMigration, forEachDocumentBatchInCollection } from "./migrationUtils";
import { editableCollections, editableCollectionsFields } from "../../lib/editor/make_editable"
import { getCollection } from "../../lib/vulcan-lib/getCollection";
import { dataToWordCount } from "../editor/conversionUtils";
import { Revisions } from "../../lib/collections/revisions/collection";

/**
 * This migration recomputes word counts in batches for all Revisions and editable
 * fields using dataToWordCount. It's based on 2019-02-14-computeWordCounts
 * which only creates word counts for documents where the field is undefined.
 */
registerMigration({
  name: "recomputeWordCounts",
  dateWritten: "2022-08-31",
  idempotent: true,
  action: async () => {
    await forEachDocumentBatchInCollection({
      collection: Revisions,
      batchSize: 1000,
      callback: async (documents: DbRevision[]) => {
        const updates: Array<any> = [];
        for (const doc of documents) {
          if (!doc.originalContents) continue;
          const { data, type } = doc.originalContents;
          const wordCount = await dataToWordCount(data, type);
          if (wordCount !== doc.wordCount) {
            updates.push({
              updateOne: {
                filter: { _id: doc._id },
                update: {
                  $set: {
                    wordCount: wordCount
                  }
                }
              }
            });
          }
        }
        // eslint-disable-next-line no-console
        console.log(`Writing ${updates.length} word counts for Revisions`);
        if (updates.length) {
          await Revisions.rawCollection().bulkWrite(updates, { ordered: false });
        }
      },
    });
    for (const collectionName of editableCollections) {
      for (const fieldName of editableCollectionsFields[collectionName]!) {
        const collection: CollectionBase<any> = getCollection(collectionName)
        await forEachDocumentBatchInCollection({
          collection,
          batchSize: 1000,
          callback: async (documents: AnyBecauseTodo[]) => {
            const updates: Array<any> = [];
            for (const doc of documents) {
              if (doc[fieldName]) {
                const { data, type } = doc[fieldName].originalContents;
                const wordCount = await dataToWordCount(data, type);
                if (wordCount !== doc[fieldName].wordCount) {
                  updates.push({
                    updateOne: {
                      filter: { _id: doc._id },
                      update: {
                        $set: {
                          [`${fieldName}.wordCount`]: wordCount
                        }
                      }
                    }
                  });
                }
              }
            }
            // eslint-disable-next-line no-console
            console.log(`Writing ${updates.length} word counts for ${collectionName}`);
            if (updates.length) {
              await collection.rawCollection().bulkWrite(updates, { ordered: false });
            }
          },
        });
      }
    }
  },
});
