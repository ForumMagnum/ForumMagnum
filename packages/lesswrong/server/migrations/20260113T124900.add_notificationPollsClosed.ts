import { addField, dropField } from "./meta/utils";
import Users from "../collections/users/collection";

// TODO check this is populated correctly on existing users
export const up = async ({db}: MigrationContext) => {
  await addField(db, Users, "notificationPollClosingSoon");
  await addField(db, Users, "notificationPollClosed");
}

export const down = async ({db}: MigrationContext) => {
  await dropField(db, Users, "notificationPollClosingSoon");
  await dropField(db, Users, "notificationPollClosed");
}
