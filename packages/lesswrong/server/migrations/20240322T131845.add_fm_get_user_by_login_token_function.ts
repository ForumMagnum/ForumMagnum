import { updateFunctions } from "./meta/utils";

export const acceptsSchemaHash = "536f72d73311be48e421692e5c2a8608";

export const up = async ({db}: MigrationContext) => {
  await updateFunctions(db);
}

export const down = async ({db}: MigrationContext) => {
  await updateFunctions(db);
}
