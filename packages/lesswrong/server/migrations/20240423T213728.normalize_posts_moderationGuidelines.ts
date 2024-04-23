import { Posts } from "../../lib/collections/posts";
import { denormalizeEditableField, normalizeEditableField } from "./meta/utils";

export const acceptsSchemaHash = "882f9e74e59c19383fb2dc6087a23ba1";

export const up = async ({db}: MigrationContext) => {
  await normalizeEditableField(db, Posts, "moderationGuidelines");
}

export const down = async ({db}: MigrationContext) => {
  await denormalizeEditableField(db, Posts, "moderationGuidelines");
}
