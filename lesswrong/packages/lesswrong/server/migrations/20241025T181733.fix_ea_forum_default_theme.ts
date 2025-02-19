import Users from "@/lib/vulcan-users";
import { updateDefaultValue } from "./meta/utils";

export const up = async ({db}: MigrationContext) => {
  await updateDefaultValue(db, Users, "theme");
}

export const down = async ({db}: MigrationContext) => {
  await updateDefaultValue(db, Users, "theme");
}
