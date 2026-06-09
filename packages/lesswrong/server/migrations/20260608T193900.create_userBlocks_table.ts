import { UserBlocks } from "../collections/userBlocks/collection";
import { createTable, dropTable } from "./meta/utils";

export const up = async ({ db }: MigrationContext) => {
  await createTable(db, UserBlocks);
};

export const down = async ({ db }: MigrationContext) => {
  await dropTable(db, UserBlocks);
};
