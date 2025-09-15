import { queueBackgroundTask, updateCustomIndexes } from "./meta/utils";;

export const up = async ({dbOutsideTransaction}: MigrationContext) => {
  // `void` instead of `await` to avoid a deadlock
  queueBackgroundTask(() => updateCustomIndexes(dbOutsideTransaction));
}

export const down = async ({db}: MigrationContext) => {
}
