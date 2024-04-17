import { updateFunctions } from "./meta/utils";

export const acceptsSchemaHash = "137496d0b5bd84406c71c0bb81025177";

export const up = async ({db}: MigrationContext) => {
  await updateFunctions(db);
}

export const down = async ({db}: MigrationContext) => {
  await updateFunctions(db);
}
