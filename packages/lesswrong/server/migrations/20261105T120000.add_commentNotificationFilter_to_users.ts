import Users from "../collections/users/collection";
import { addField, dropField } from "./meta/utils";

export const up = async ({db}: MigrationContext) => {
  await addField(db, Users, "commentNotificationFilter");
};

export const down = async ({db}: MigrationContext) => {
  await dropField(db, Users, "commentNotificationFilter");
};
