import Users from "../collections/users/collection";
import { dropField } from "./meta/utils";

export const up = async ({db}: MigrationContext) => {
  await dropField(db, Users, "reenableDraftJs");
}

export const down = async ({db}: MigrationContext) => {
}
