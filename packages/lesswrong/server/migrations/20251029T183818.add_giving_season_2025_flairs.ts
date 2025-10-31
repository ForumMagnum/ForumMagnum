import { addField, dropField } from "./meta/utils";
import Users from "../collections/users/collection";

export const up = async ({db}: MigrationContext) => {
  await addField(db, Users, "givingSeason2025DonatedFlair");
  await addField(db, Users, "givingSeason2025VotedFlair");
}

export const down = async ({db}: MigrationContext) => {
  await dropField(db, Users, "givingSeason2025DonatedFlair");
  await dropField(db, Users, "givingSeason2025VotedFlair");
}
