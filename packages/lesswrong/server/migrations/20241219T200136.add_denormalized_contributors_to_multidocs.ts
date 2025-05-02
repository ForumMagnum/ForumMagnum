import { addField, dropField } from "./meta/utils";
import { MultiDocuments } from "@/server/collections/multiDocuments/collection";

export const up = async ({db}: MigrationContext) => {
  await addField(db, MultiDocuments, "htmlWithContributorAnnotations");
}

export const down = async ({db}: MigrationContext) => {
  await dropField(db, MultiDocuments, "htmlWithContributorAnnotations");
}
