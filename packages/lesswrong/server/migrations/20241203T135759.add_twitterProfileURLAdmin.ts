import Users from "@/lib/collections/users/collection";
import { addField, dropField } from "./meta/utils";

export const up = async ({db}: MigrationContext) => {
  await addField(db, Users, "twitterProfileURLAdmin");
}

export const down = async ({db}: MigrationContext) => {
  await dropField(db, Users, "twitterProfileURLAdmin");
}
