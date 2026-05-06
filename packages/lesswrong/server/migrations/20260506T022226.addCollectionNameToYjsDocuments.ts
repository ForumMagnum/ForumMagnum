import YjsDocuments from "@/server/collections/yjsDocuments/collection";
import { addField, dropField, dropIndexByName, updateIndexes } from "./meta/utils";

export const up = async ({db}: MigrationContext) => {
  // Add the collectionName column with a default of "Posts" so existing rows
  // (all of which are Posts-scoped today) backfill in a single instant statement.
  await addField(db, YjsDocuments, "collectionName");

  // Add the new composite unique index on (collectionName, documentId).
  await updateIndexes(YjsDocuments);

  // Drop the legacy single-column unique index on `documentId`. The composite
  // is sufficient and the legacy unique would otherwise enforce a cross-
  // collection uniqueness we don't want (a Posts row and a ResearchDocuments
  // row sharing an _id would be rejected even though the new composite allows it).
  await dropIndexByName(db, YjsDocuments, "idx_YjsDocuments_documentId");
}

export const down = async ({db}: MigrationContext) => {
  await dropField(db, YjsDocuments, "collectionName");
}
