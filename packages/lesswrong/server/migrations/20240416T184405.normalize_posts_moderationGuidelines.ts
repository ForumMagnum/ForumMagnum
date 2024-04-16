import { denormalizeEditableField, normalizeEditableField } from "./meta/utils";

export const acceptsSchemaHash = "528a4db36848699725f40ea694eccc8e";

export const up = async ({db}: MigrationContext) => {
  await normalizeEditableField(db);
}

export const down = async ({db}: MigrationContext) => {
  await denormalizeEditableField(db);
}
