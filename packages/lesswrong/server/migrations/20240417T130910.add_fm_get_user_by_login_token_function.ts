import { updateFunctions } from "./meta/utils";

export const acceptsSchemaHash = "28d910f4e059af7209e392016f25246e";

export const up = async ({db}: MigrationContext) => {
  await updateFunctions(db);
}

export const down = async ({db}: MigrationContext) => {
  await updateFunctions(db);
}
