import { updateCustomIndexes } from "./meta/utils";

export const up = async ({dbOutsideTransaction}: MigrationContext) =>
  void updateCustomIndexes(dbOutsideTransaction);

export const down = up;
