import { MultiDocuments } from "@/lib/collections/multiDocuments/collection";
import { addField, dropField } from "./meta/utils"

export const up = async ({db}: MigrationContext) => {
  await addField(db, MultiDocuments, 'deleted');
}

export const down = async ({db}: MigrationContext) => {
  await dropField(db, MultiDocuments, 'deleted');
}
