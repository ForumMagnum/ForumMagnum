import Users from "../collections/users/collection";
import { updateIndexes } from "./meta/utils";

export const up = async ({db}: MigrationContext) => {
  await updateIndexes(Users);
}

export const down = async ({db}: MigrationContext) => {
}
