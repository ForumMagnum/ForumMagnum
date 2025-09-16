import { queueMigrationTask } from "./meta/migrationTaskQueue";
import { updateCustomIndexes } from "./meta/utils";

export const up = async ({dbOutsideTransaction}: MigrationContext) => {
  // `void` instead of `await` when using `dbOutsideTransaction` to avoid a
  // nasty deadlock
  queueMigrationTask(() => updateCustomIndexes(dbOutsideTransaction));
}
