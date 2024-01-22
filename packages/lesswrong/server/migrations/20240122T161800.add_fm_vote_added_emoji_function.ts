import { updateFunctions } from "./meta/utils";

export const acceptsSchemaHash = "be9f2f07d19841b17f8005c2c8b5f2c4";

export const up = async ({db}: MigrationContext) => {
  await updateFunctions(db);
}

export const down = async ({db}: MigrationContext) => {
  await updateFunctions(db);
}
