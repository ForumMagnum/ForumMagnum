import Unlockables from "../collections/unlockables/collection";
import { createTable, dropTable, updateIndexes } from "./meta/utils"

export const up = async ({db}: MigrationContext) => {
  await createTable(db, Unlockables);
  await updateIndexes(Unlockables);
}

export const down = async ({db}: MigrationContext) => {
  await dropTable(db, Unlockables);
}
