import { addField, dropField, updateIndexes } from "./meta/utils";
import Users from "../collections/users/collection";

export const up = async ({db}: MigrationContext) => {
  await addField(db, Users, "keywordAlerts");
  await addField(db, Users, "notificationKeywordAlert");
  await updateIndexes(Users);
}

export const down = async ({db}: MigrationContext) => {
  await dropField(db, Users, "keywordAlerts");
  await dropField(db, Users, "notificationKeywordAlert");
  await updateIndexes(Users);
}
