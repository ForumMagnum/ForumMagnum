import { addField, dropField } from "./meta/utils";
import { MultiDocuments } from "@/lib/collections/multiDocuments/collection";

export const up = async ({db}: MigrationContext) => {
  await addField(db, MultiDocuments, 'contributionStats');
}

export const down = async ({db}: MigrationContext) => {
  await dropField(db, MultiDocuments, 'contributionStats');
}
