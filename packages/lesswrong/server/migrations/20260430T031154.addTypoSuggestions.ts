import TypoSuggestions from "@/server/collections/typoSuggestions/collection";
import { createTable, dropTable, addField, dropField } from "./meta/utils";

export const up = async ({db}: MigrationContext) => {
  await createTable(db, TypoSuggestions);
  await addField(db, "Users", "notificationTypoSuggestions");
}

export const down = async ({db}: MigrationContext) => {
  await dropField(db, "Users", "notificationTypoSuggestions");
  await dropTable(db, TypoSuggestions);
}
