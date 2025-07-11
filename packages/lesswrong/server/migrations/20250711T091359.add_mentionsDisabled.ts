import Users from "../collections/users/collection";
import { addField, dropField } from "./meta/utils";

export const up = async ({db}: MigrationContext) => {
  await addField(db, Users, "mentionsDisabled");
}

export const down = async ({db}: MigrationContext) => {
  await dropField(db, Users, "mentionsDisabled");
}
