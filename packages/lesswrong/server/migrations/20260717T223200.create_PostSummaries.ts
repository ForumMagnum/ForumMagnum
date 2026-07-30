import PostSummaries from "../../server/collections/postSummaries/collection";
import { createTable, dropTable, updateIndexes } from "./meta/utils";

export const up = async ({ db }: MigrationContext) => {
  await createTable(db, PostSummaries);
  await updateIndexes(PostSummaries);
};

export const down = async ({ db }: MigrationContext) => {
  await dropTable(db, PostSummaries);
};
