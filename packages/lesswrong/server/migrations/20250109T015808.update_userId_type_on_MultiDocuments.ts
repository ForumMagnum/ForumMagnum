import { MultiDocuments } from "@/lib/collections/multiDocuments/collection";
import { updateFieldType } from "./meta/utils";

export const up = async ({db}: MigrationContext) => {
  await updateFieldType(db, MultiDocuments, "userId");
};
