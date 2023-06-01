import PostEmbeddings from "../../lib/collections/postEmbeddings/collection";
import { createTable, dropTable } from "./meta/utils";

export const acceptsSchemaHash = "876226bbf0f63f632ea1e55aabeefb88";

export const up = async ({db}: MigrationContext) => {
  if (PostEmbeddings.isPostgres()) {
    await createTable(db, PostEmbeddings);
  }
}

export const down = async ({db}: MigrationContext) => {
  if (PostEmbeddings.isPostgres()) {
    await dropTable(db, PostEmbeddings);
  }
}
