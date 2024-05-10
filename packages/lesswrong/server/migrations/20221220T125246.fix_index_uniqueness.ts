import { getAllCollections } from "../../lib/vulcan-lib/getCollection";
import { createIndex, dropIndex } from "./meta/utils";

export const up = async ({db}: MigrationContext) => {
  // This migration is no longer needed for new databases, and messes with creating indexes concurrently
  // for (const collection of getAllCollections()) {
  //   const table = collection.getTable();
  //   for (const index of table.getIndexes()) {
  //     if (index.isUnique() || index.getPartialFilterExpression()) {
  //       try {
  //         await dropIndex(db, collection, index);
  //       } catch {
  //         // eslint-disable-next-line no-console
  //         console.warn("Index doesn't exist:", index);
  //       }
  //       // allowConcurrent = false because CONCURRENTLY isn't allowed inside a transaction
  //       await createIndex(db, collection, index, true, false);
  //     }
  //   }
  // }
}
