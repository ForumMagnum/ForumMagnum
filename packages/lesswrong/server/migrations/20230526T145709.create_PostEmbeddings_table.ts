import PostEmbeddings from "../../lib/collections/postEmbeddings/collection";
import { createTable, dropTable } from "./meta/utils";

export const acceptsSchemaHash = "8883cd9c0033c014254735b65e7915c5";

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
