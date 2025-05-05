import Users from "../collections/users/collection";
import { dropField } from "./meta/utils";

export const up = async ({db}: MigrationContext) => {
  dropField(db, Users, "reenableDraftJs" as any);
}

export const down = async ({db}: MigrationContext) => {
}
