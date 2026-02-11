import { Revisions } from "../collections/revisions/collection";
import { addField, dropField } from "./meta/utils";

export const up = async ({db}: MigrationContext) => {
  await addField(db, Revisions, "yjsState");
}

export const down = async ({db}: MigrationContext) => {
  await dropField(db, Revisions, "yjsState");
}
