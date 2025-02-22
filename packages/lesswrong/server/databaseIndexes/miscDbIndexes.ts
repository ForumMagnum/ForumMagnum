import { getAllCollections } from "../vulcan-lib";
import { DatabaseIndexSet } from "./databaseIndexSet";

export function getMiscDbIndexes() {
  const indexSet = new DatabaseIndexSet();
  
  for (const collection of getAllCollections()) {
    indexSet.addIndex(collection.collectionName, {schemaVersion:1});
  }

  return indexSet;
}
