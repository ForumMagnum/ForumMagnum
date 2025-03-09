import Tags from "@/server/collections/tags/collection"
import { addField, dropField } from "./meta/utils";
import { MultiDocuments } from "@/server/collections/multiDocuments/collection";

export const up = async ({db}: MigrationContext) => {
  await addField(db, Tags, "pingbacks");
  await addField(db, MultiDocuments, "pingbacks");
}

export const down = async ({db}: MigrationContext) => {
  await dropField(db, Tags, "pingbacks");
  await dropField(db, MultiDocuments, "pingbacks");
}
