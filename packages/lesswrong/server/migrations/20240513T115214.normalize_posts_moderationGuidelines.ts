import { Posts } from "../../lib/collections/posts";
import { denormalizeEditableField, normalizeEditableField } from "./meta/utils";

export const acceptsSchemaHash = "80ff63223032d7a466bbfbfa292b48b4";

export const up = async ({db}: MigrationContext) => {
  await normalizeEditableField(db, Posts, "moderationGuidelines");
}

export const down = async ({db}: MigrationContext) => {
  await denormalizeEditableField(db, Posts, "moderationGuidelines");
}
