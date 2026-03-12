import { MailgunValidations } from "../collections/mailgunValidations/collection";
import { createTable, dropTable } from "./meta/utils";

export const up = async ({ db }: MigrationContext) => {
  await createTable(db, MailgunValidations);
};

export const down = async ({ db }: MigrationContext) => {
  await dropTable(db, MailgunValidations);
};


