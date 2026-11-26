import Users from "../collections/users/collection";
import { addField, dropField } from "./meta/utils";

export const up = async ({db}: MigrationContext) => {
  await addField(db, Users, "commentNotificationFilter");
  await addField(db, Users, "hideCommentNotificationFilterSuggestion");
};

export const down = async ({db}: MigrationContext) => {
  await dropField(db, Users, "hideCommentNotificationFilterSuggestion");
  await dropField(db, Users, "commentNotificationFilter");
};
