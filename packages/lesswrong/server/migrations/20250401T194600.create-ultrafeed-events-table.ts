import { UltraFeedEvents } from "../collections/ultraFeedEvents/collection"; // Import the collection definition
import { createTable, dropTable } from "./meta/utils"; // Import helpers (adjust path if needed)

/**
 * Creates the UltraFeedEvents table based on its collection definition.
 */
export const up = async ({db}: MigrationContext) => {
  await createTable(db, UltraFeedEvents);
}

/**
 * Drops the UltraFeedEvents table.
 */
export const down = async ({db}: MigrationContext) => {
  await dropTable(db, UltraFeedEvents);
}
