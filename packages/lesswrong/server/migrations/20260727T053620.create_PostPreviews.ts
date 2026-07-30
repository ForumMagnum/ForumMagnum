import PostPreviews from "../../server/collections/postPreviews/collection";
import { createTable, dropTable, updateIndexes } from "./meta/utils";

export const up = async ({ db }: MigrationContext) => {
  await createTable(db, PostPreviews);
  await updateIndexes(PostPreviews);
};

export const down = async ({ db }: MigrationContext) => {
  await dropTable(db, PostPreviews);
};
