import YjsDocuments from "../collections/yjsDocuments/collection";
import { createTable } from "./meta/utils";

export const up = async ({db}: MigrationContext) => {
  await createTable(db, YjsDocuments);
}

export const down = async ({db}: MigrationContext) => {
}
