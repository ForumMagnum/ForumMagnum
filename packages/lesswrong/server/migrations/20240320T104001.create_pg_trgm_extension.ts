import { installExtensions } from "./meta/utils"

export const acceptsSchemaHash = "d74b93607c019ef9eef124d337de9533";

export const up = async ({db}: MigrationContext) => {
  await installExtensions(db);
}

export const down = async ({db}: MigrationContext) => {
  await installExtensions(db);
}
