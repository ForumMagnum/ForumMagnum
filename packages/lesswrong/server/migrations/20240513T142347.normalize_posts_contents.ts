import { Posts } from "../../lib/collections/posts";
import { denormalizeEditableField, normalizeEditableField } from "./meta/utils";

export const acceptsSchemaHash = "fbdc0322e89273b427d262fcc7ae5f46";

export const up = async ({db}: MigrationContext) => {
  await normalizeEditableField(db, Posts, "contents");
}

export const down = async ({db}: MigrationContext) => {
  await denormalizeEditableField(db, Posts, "contents");
}
