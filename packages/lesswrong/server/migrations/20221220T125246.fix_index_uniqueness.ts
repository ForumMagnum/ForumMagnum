import { getAllCollections } from "../../lib/vulcan-lib/getCollection";
import { createIndex, dropIndex } from "./meta/utils";

export const up = async ({db}: MigrationContext) => {
  for (const collection of getAllCollections()) {
    const table = collection.getTable();
    for (const index of table.getRequestedIndexes()) {
      if (index.isUnique() || index.getPartialFilterExpression()) {
        try {
          await dropIndex(db, collection, index);
        } catch {
          // eslint-disable-next-line no-console
          console.warn("Index doesn't exist:", index);
        }
        await createIndex(db, collection, index, true, false);
      }
    }
  }
}
