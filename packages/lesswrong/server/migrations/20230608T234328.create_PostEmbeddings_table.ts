import PostEmbeddings from "../../server/collections/postEmbeddings/collection";
import { createTable, dropTable } from "./meta/utils";

export const acceptsSchemaHash = "8a6bdab9352a0251d6db2fa801b6b593";

export const up = async ({db}: MigrationContext) => {
  await createTable(db, PostEmbeddings);
}

export const down = async ({db}: MigrationContext) => {
  await dropTable(db, PostEmbeddings);
}
