import { Posts } from "../../lib/collections/posts";
import { denormalizeEditableField, normalizeEditableField } from "./meta/utils";

export const acceptsSchemaHash = "d2ff8b556fc6f740b2bb57ddf5347f64";

export const up = async ({db}: MigrationContext) => {
  await normalizeEditableField(db, Posts, "contents");
}

export const down = async ({db}: MigrationContext) => {
  await denormalizeEditableField(db, Posts, "contents");
}
