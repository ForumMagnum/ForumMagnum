import Unlockables from "../collections/unlockables/collection";
import { createTable } from "./meta/utils"

export const up = async ({db}: MigrationContext) => {
  await createTable(db, Unlockables);
}

export const down = async ({db}: MigrationContext) => {
}
