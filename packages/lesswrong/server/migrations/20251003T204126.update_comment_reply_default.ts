import Users from "@/server/collections/users/collection";
import { updateDefaultValue } from "./meta/utils";

export const up = async ({db}: MigrationContext) => {
  await updateDefaultValue(db, Users, "notificationRepliesToMyComments");
}

export const down = async ({db}: MigrationContext) => {
}
