import { DatabaseIndexSet } from "../../lib/utils/databaseIndexSet";
import { allSchemas } from "@/lib/schema/allSchemas";

export function getMiscDbIndexes() {
  const indexSet = new DatabaseIndexSet();

  const collectionNamesWithSchemaVersion = Object.entries(allSchemas)
    .filter(([_, schema]) => 'schemaVersion' in schema)
    .map(([collectionName]) => collectionName as CollectionNameString);
  
  for (const collectionName of collectionNamesWithSchemaVersion) {
    indexSet.addIndex(collectionName, {schemaVersion:1});
  }

  return indexSet;
}

export function getDbIndexesOnRevisions() {
  const indexSet = new DatabaseIndexSet();
  indexSet.addIndex("Revisions", {userId: 1, collectionName: 1, editedAt: 1});
  indexSet.addIndex("Revisions", {collectionName:1, fieldName:1, editedAt:1, _id: 1, changeMetrics:1});
  indexSet.addIndex("Revisions", {documentId: 1, version: 1, fieldName: 1, editedAt: 1})
  return indexSet;
}


export function getDbIndexesOnFoo() {
  const indexSet = new DatabaseIndexSet();
  return indexSet;
}
