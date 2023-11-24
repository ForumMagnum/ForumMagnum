import { installExtensions, updateFunctions } from "./meta/utils";

export const up = async ({db}: MigrationContext) => {
  await installExtensions(db);
  await updateFunctions(db);
}
