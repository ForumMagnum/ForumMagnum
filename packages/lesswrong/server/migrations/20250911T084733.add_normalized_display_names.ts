import { updateFunctions, updateIndexes } from "./meta/utils"
import Users from "../collections/users/collection";

export const up = async ({db}: MigrationContext) => {
  await updateFunctions(db);
  await updateIndexes(Users);
}

export const down = async ({db}: MigrationContext) => {
  await updateFunctions(db);
  await updateIndexes(Users);
}
