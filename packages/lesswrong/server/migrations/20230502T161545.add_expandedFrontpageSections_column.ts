import Users from "../../lib/vulcan-users";
import { addField, dropField } from "./meta/utils";

export const acceptsSchemaHash = "282a309e6e1a86d42144f8caa61353b5";

export const up = async ({db}: MigrationContext) => {
  if (Users.isPostgres()) {
    await addField(db, Users, "expandedFrontpageSections");
  }
}

export const down = async ({db}: MigrationContext) => {
  if (Users.isPostgres()) {
    await dropField(db, Users, "expandedFrontpageSections");
  }
}
