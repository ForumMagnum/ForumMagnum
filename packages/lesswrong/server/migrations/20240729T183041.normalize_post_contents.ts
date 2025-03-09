import { Posts } from "../../server/collections/posts/collection";
import { denormalizeEditableField, normalizeEditableField } from "./meta/utils";

export const acceptsSchemaHash = "d2ff8b556fc6f740b2bb57ddf5347f64";

export const up = async ({db, dbOutsideTransaction}: MigrationContext) => {
  await normalizeEditableField({
    db: dbOutsideTransaction,
    collectionName: "Posts",
    fieldName: "contents",
    dropField: false,
  });
}

export const down = async ({db}: MigrationContext) => {
  await denormalizeEditableField(db, Posts, "contents");
}
