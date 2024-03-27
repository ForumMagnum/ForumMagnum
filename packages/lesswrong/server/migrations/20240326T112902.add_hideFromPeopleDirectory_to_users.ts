import Users from "../../lib/vulcan-users";
import { addField, dropField } from "./meta/utils";

export const acceptsSchemaHash = "ce81160bade97471fbf80ced45b650ac";

export const up = async ({db}: MigrationContext) => {
  await addField(db, Users, "hideFromPeopleDirectory");
}

export const down = async ({db}: MigrationContext) => {
  await dropField(db, Users, "hideFromPeopleDirectory");
}
