import { addField, dropField } from "./meta/utils";

export const up = async ({db}: MigrationContext) => {
  await addField(db, "ForumEvents", "customComponent");
}

export const down = async ({db}: MigrationContext) => {
  await dropField(db, "ForumEvents", "customComponent");
}
