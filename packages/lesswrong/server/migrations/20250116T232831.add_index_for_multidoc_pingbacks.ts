import { updateCustomIndexes } from "./meta/utils";import { queueBackgroundTask } from "./meta/backgroundTaskQueue";
;

export const up = async ({dbOutsideTransaction}: MigrationContext) => {
  // `void` instead of `await` when using `dbOutsideTransaction` to avoid a
  // nasty deadlock
  queueBackgroundTask(() => updateCustomIndexes(dbOutsideTransaction));
}
