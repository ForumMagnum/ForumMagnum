import { Posts } from "../../lib/collections/posts";
import { denormalizeEditableField, normalizeEditableField } from "./meta/utils";

export const acceptsSchemaHash = "2d15ba155031a8c3e7ea1851c1bbce17";

export const up = async ({db}: MigrationContext) => {
  await normalizeEditableField(db, Posts, "moderationGuidelines");
}

export const down = async ({db}: MigrationContext) => {
  await denormalizeEditableField(db, Posts, "moderationGuidelines");
}
