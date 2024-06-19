import { Posts } from "../../lib/collections/posts";
import { denormalizeEditableField, normalizeEditableField } from "./meta/utils";

export const acceptsSchemaHash = "d95c1228f4b2a050f51e79c38e92e282";

export const up = async ({db}: MigrationContext) => {
  await normalizeEditableField(db, Posts, "contents");
}

export const down = async ({db}: MigrationContext) => {
  await denormalizeEditableField(db, Posts, "contents");
}
