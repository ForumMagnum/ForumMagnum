import { BoolType } from "../sql/Type";
import { addRemovedField, dropRemovedField } from "./meta/utils"
import Users from "@/lib/collections/users/collection";

export const up = async ({db}: MigrationContext) => {
  await addRemovedField(db, Users, "givingSeason2024DonatedFlair", new BoolType());
}

export const down = async ({db}: MigrationContext) => {
  await dropRemovedField(db, Users, "givingSeason2024DonatedFlair");
}
