import { updateFunctions } from "./meta/utils";

export const acceptsSchemaHash = "bd3603a518355f1cbb6346c93702811d";

export const up = async ({db}: MigrationContext) => {
  await updateFunctions(db);
}

export const down = async ({db}: MigrationContext) => {
  await updateFunctions(db);
}
