import Users from "@/lib/collections/users/collection";
import { addField, dropField } from "./meta/utils";

export const up = async ({db}: MigrationContext) => {
  await addField(db, Users, "givingSeason2024VotedFlair");
}

export const down = async ({db}: MigrationContext) => {
  await dropField(db, Users, "givingSeason2024VotedFlair");
}
