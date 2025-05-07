import AutomatedContentEvaluations from "../collections/automatedContentEvaluations/collection";
import { createTable, dropTable, updateIndexes } from "./meta/utils";

export const up = async ({db}: MigrationContext) => {
  // There is not much data in this table, and it's not too important.
  await dropTable(db, AutomatedContentEvaluations);
  await createTable(db, AutomatedContentEvaluations);
  await updateIndexes(AutomatedContentEvaluations);
}

export const down = async ({db}: MigrationContext) => {
  await dropTable(db, AutomatedContentEvaluations);
  await createTable(db, AutomatedContentEvaluations);
  await updateIndexes(AutomatedContentEvaluations);
}
