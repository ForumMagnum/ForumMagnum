import { installExtensions } from "./meta/utils"

export const acceptsSchemaHash = "ab72105cb0319f564fb72f0ef5506015";

export const up = async ({db}: MigrationContext) => {
  await installExtensions(db);
}

export const down = async ({db}: MigrationContext) => {
  await installExtensions(db);
}
