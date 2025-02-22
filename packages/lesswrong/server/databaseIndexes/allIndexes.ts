import { expectedCustomPgIndexes, expectedIndexes } from "@/lib/collectionIndexUtils";
import { DatabaseIndexSet } from "./databaseIndexSet";
import { getDbIndexesOnPosts } from "./postsDbIndexes";
import { getMiscDbIndexes } from "./miscDbIndexes";
import { getDbIndexesOnUsers } from "./usersDbIndexes";
import { getDbIndexesOnTags } from "./tagsDbIndexes";
import { getDbIndexesOnComments } from "./commentsDbIndexes";

export function getAllIndexes(): DatabaseIndexSet {
  const indexSets: DatabaseIndexSet[] = [
    getDbIndexesOnComments(),
    getDbIndexesOnPosts(),
    getDbIndexesOnTags(),
    getDbIndexesOnUsers(),
    getMiscDbIndexes(),
    getScatteredIndexes(),
  ];
  return mergeDatabaseIndexSets(indexSets);
}

function getScatteredIndexes(): DatabaseIndexSet {
  const indexSet = new DatabaseIndexSet();
  for (const collectionName of Object.keys(expectedIndexes) as CollectionNameString[]) {
    for (const index in expectedIndexes[collectionName]) {
      indexSet.addIndex(collectionName, index);
    }
  }
  for (const customPgIndex of expectedCustomPgIndexes) {
    indexSet.addCustomPgIndex(customPgIndex.source, customPgIndex.options);
  }
  return indexSet;
}

function mergeDatabaseIndexSets(indexSets: DatabaseIndexSet[]): DatabaseIndexSet {
  const merged = new DatabaseIndexSet();
  for (const indexSet of indexSets) {
    for (const collectionName of Object.keys(indexSet.mongoStyleIndexes) as CollectionNameString[]) {
      for (const mongoStyleIndex of indexSet.mongoStyleIndexes[collectionName] ?? []) {
        merged.addIndex(collectionName, mongoStyleIndex);
      }
    }
    for (const customPgIndex of indexSet.customPgIndexes) {
      merged.addCustomPgIndex(customPgIndex.source, customPgIndex.options);
    }
  }
  return merged;
}
