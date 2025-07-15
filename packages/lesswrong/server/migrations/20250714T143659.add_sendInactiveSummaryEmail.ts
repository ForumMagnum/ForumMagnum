import { addField, dropField } from "./meta/utils";
import Users from "../collections/users/collection";

export const up = async ({db}: MigrationContext) => {
  await addField(db, Users, "sendInactiveSummaryEmail");
  await addField(db, Users, "inactiveSummaryEmailSentAt");
}

export const down = async ({db}: MigrationContext) => {
  await dropField(db, Users, "sendInactiveSummaryEmail");
  await dropField(db, Users, "inactiveSummaryEmailSentAt");
}
