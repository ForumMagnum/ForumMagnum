import { updateFunctions } from "./meta/utils";

export const up = async ({db}: MigrationContext) => {
  updateFunctions(db);
}

export const down = async ({db}: MigrationContext) => {
}
