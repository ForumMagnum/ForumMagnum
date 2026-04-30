import TypoSuggestions from "@/server/collections/typoSuggestions/collection";
import { addField, dropField } from "./meta/utils";

export const up = async ({db}: MigrationContext) => {
  await addField(db, TypoSuggestions, "llmCanonicalQuote");
}

export const down = async ({db}: MigrationContext) => {
  await dropField(db, TypoSuggestions, "llmCanonicalQuote");
}
