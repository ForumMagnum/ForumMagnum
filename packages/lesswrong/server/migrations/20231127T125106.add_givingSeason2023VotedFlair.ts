import Users from "../../lib/collections/users/collection";
import { addField, dropField } from "./meta/utils";

export const acceptsSchemaHash = "fe1aa6911a910e4e72373cb4293fb031";

export const up = async ({db}: MigrationContext) => {
  if (Users.isPostgres()) {
    await addField(db, Users, "givingSeason2023VotedFlair");
  }
}

export const down = async ({db}: MigrationContext) => {
  if (Users.isPostgres()) {
    await dropField(db, Users, "givingSeason2023VotedFlair");
  }
}
