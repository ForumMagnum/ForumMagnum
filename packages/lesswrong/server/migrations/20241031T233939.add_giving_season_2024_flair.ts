import { addField, dropField } from "./meta/utils"
import Users from "@/lib/vulcan-users";

export const up = async ({db}: MigrationContext) => {
  await addField(db, Users, "givingSeason2024DonatedFlair");
}

export const down = async ({db}: MigrationContext) => {
  await dropField(db, Users, "givingSeason2024DonatedFlair");
}
