import Revisions from "../collections/revisions/collection";
import { getCollection } from "../collections/allCollections";
import { getEditableFieldsByCollection } from "../editor/editableSchemaFieldHelpers";
import { dropField } from "../migrations/meta/utils";
import { getSqlClientOrThrow } from "../sql/sqlClient";
import { forEachDocumentBatchInCollection, registerMigration } from "./migrationUtils";

const BATCH_SIZE = 500;

async function dropDenormalizedEditableOriginalContents() {
  for (const [collectionName, editableFields] of Object.entries(getEditableFieldsByCollection())) {
    const collection = getCollection(collectionName as CollectionNameString) as CollectionBase<CollectionNameString>;

    for (const [fieldName, fieldSpec] of Object.entries(editableFields)) {
      if (fieldSpec.graphql.editableFieldOptions.normalized) {
        continue;
      }

      await forEachDocumentBatchInCollection({
        collection,
        batchSize: BATCH_SIZE,
        filter: {
          [`${fieldName}.originalContents`]: { $exists: true },
        },
        projection: { _id: 1 },
        callback: async (documents) => {
          if (documents.length === 0) {
            return;
          }

          await collection.rawCollection().bulkWrite(documents.map((document) => ({
            updateOne: {
              filter: { _id: document._id },
              update: {
                $unset: {
                  [`${fieldName}.originalContents`]: "",
                },
              },
            },
          })), { ordered: false });
        },
      });
    }
  }
}

export default registerMigration({
  name: "dropOriginalContentsFromRevs",
  dateWritten: "2026-05-26",
  idempotent: true,
  action: async () => {
    const db = getSqlClientOrThrow();
    await dropDenormalizedEditableOriginalContents();
    await dropField(db, Revisions, "originalContents");
  },
});
