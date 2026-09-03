import { updateCustomIndexes } from "./meta/utils";

export const up = async ({db}: MigrationContext) => void updateCustomIndexes(db);

export const down = up;
