import YjsDocuments from "@/server/collections/yjsDocuments/collection";
import { addField, dropField } from "./meta/utils";

export const up = async ({db}: MigrationContext) => {
  await addField(db, YjsDocuments, "collectionName");
}

export const down = async ({db}: MigrationContext) => {
  await dropField(db, YjsDocuments, "collectionName");
}
