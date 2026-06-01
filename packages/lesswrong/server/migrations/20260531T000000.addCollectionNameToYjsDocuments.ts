import YjsDocuments from "@/server/collections/yjsDocuments/collection";
import { addField, dropField } from "./meta/utils";

export const up = async ({db}: MigrationContext) => {
  // A constant default backfills existing rows without a table rewrite (PG11+).
  //
  // We deliberately keep the single-column UNIQUE("documentId") index rather
  // than making it composite with collectionName: document ids should be
  // globally unique across collections (a collision would be a bug we'd want
  // rejected), so the Hocuspocus upsert keeps using ON CONFLICT ("documentId").
  await addField(db, YjsDocuments, "collectionName");
}

export const down = async ({db}: MigrationContext) => {
  await dropField(db, YjsDocuments, "collectionName");
}
