import { queueMigrationTask } from "./meta/migrationTaskQueue";
import { updateCustomIndexes } from "./meta/utils";

export const up = async ({ dbOutsideTransaction }: MigrationContext) => {
  queueMigrationTask(() => updateCustomIndexes(dbOutsideTransaction));
};
