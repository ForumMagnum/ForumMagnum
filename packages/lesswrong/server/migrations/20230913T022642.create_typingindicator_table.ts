import TypingIndicator from "../../lib/collections/typingIndicators/collection";
import { createTable, dropTable } from "./meta/utils";

export const acceptsSchemaHash = "24bc9fe665eddf3a725921ac092d7b1b"

export const up = async ({db}: MigrationContext) => {
  if (TypingIndicator.isPostgres()) {
    await createTable(db, TypingIndicator);
  }
}

export const down = async ({db}: MigrationContext) => {
  if (TypingIndicator.isPostgres()) {
    await dropTable(db, TypingIndicator);
  }
}
