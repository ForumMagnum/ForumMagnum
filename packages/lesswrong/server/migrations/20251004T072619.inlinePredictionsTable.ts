import InlinePredictions from "../collections/inlinePredictions/collection";
import { createTable } from "./meta/utils";

export const up = async ({db}: MigrationContext) => {
  await createTable(db, InlinePredictions);
}

export const down = async ({db}: MigrationContext) => {
}
