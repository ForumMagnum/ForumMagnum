import { getAllCollections } from "../../lib/vulcan-lib/getCollection";
import { getAllIndexes } from "../databaseIndexes/allIndexes";
import TableIndex from "../sql/TableIndex";
import { createIndex, dropIndex } from "./meta/utils";

export const up = async ({db}: MigrationContext) => {
  for (const collection of getAllCollections()) {
    const table = collection.getTable();
    const indexes = getAllIndexes().mongoStyleIndexes[collection.collectionName] ?? [];
    const tableIndexes = indexes.map((i) => new TableIndex(table.getName(), i.key, i.options));
    for (const index of tableIndexes) {
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
