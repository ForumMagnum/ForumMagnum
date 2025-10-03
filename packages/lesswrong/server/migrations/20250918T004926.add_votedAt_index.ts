import Votes from "../collections/votes/collection";
import { updateIndexes } from "./meta/utils"

export const up = async ({db}: MigrationContext) => {
  await updateIndexes(Votes);
}

export const down = async ({db}: MigrationContext) => {
}
