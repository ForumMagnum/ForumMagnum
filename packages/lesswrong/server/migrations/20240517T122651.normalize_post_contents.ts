import { Posts } from "../../lib/collections/posts";
import { denormalizeEditableField, normalizeEditableField } from "./meta/utils";

export const acceptsSchemaHash = "6b6fc9b563d59dea9ffb087150d7b3c3";

export const up = async ({db}: MigrationContext) => {
  await normalizeEditableField(db, Posts, "contents");
}

export const down = async ({db}: MigrationContext) => {
  await denormalizeEditableField(db, Posts, "contents");
}
