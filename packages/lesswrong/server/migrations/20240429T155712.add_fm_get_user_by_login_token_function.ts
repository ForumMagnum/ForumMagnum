import { updateFunctions } from "./meta/utils";

export const acceptsSchemaHash = "ce481181abda13b83244a8ccd8ed5782";

export const up = async ({db}: MigrationContext) => {
  await updateFunctions(db);
}

export const down = async ({db}: MigrationContext) => {
  await updateFunctions(db);
}
