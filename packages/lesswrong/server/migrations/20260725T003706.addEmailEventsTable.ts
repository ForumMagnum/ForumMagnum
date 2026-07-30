import EmailEvents from "../collections/emailEvents/collection";
import { createTable, dropTable, updateIndexes } from "./meta/utils";

export const up = async ({ db }: MigrationContext) => {
  await createTable(db, EmailEvents);
  await updateIndexes(EmailEvents);
};

export const down = async ({ db }: MigrationContext) => {
  await dropTable(db, EmailEvents);
};
