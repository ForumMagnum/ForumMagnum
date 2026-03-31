import fs from "fs";
import path from "path";
import { isAnyTest, isCodegen, isIntegrationTest } from "@/lib/executionEnvironment";

interface CollectionTypeNameMaps {
  collectionNameToTypeName: Record<string, string>;
  typeNameToCollectionName: Record<string, string>;
  tableNameToCollectionName: Record<string, string>;
  testTableNameToCollectionName: Record<string, string>;
}

interface CollectionTypeNamePair {
  collectionName: string;
  typeName: string;
}

const collectionDefinitionRegex = /collectionName:\s*["']([^"']+)["'](?:\s+as\s+CollectionNameString)?\s*,[\s\S]*?typeName:\s*["']([^"']+)["']/g;

function getCollectionTypeNamePairsFromFile(filePath: string): CollectionTypeNamePair[] {
  const source = fs.readFileSync(filePath, "utf8");
  const collectionTypeNamePairs: CollectionTypeNamePair[] = [];

  for (const match of source.matchAll(collectionDefinitionRegex)) {
    const [, collectionName, typeName] = match;
    collectionTypeNamePairs.push({ collectionName, typeName });
  }

  if (collectionTypeNamePairs.length === 0) {
    throw new Error(`Failed to find collection metadata in ${filePath}`);
  }

  return collectionTypeNamePairs;
}

function getCollectionTypeNamePairs(): CollectionTypeNamePair[] {
  const collectionsDir = path.resolve(__dirname, "..", "collections");
  const collectionTypeNamePairs: CollectionTypeNamePair[] = [];

  for (const entry of fs.readdirSync(collectionsDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) {
      continue;
    }

    const collectionFilePath = path.join(collectionsDir, entry.name, "collection.ts");
    if (!fs.existsSync(collectionFilePath)) {
      continue;
    }

    collectionTypeNamePairs.push(...getCollectionTypeNamePairsFromFile(collectionFilePath));
  }

  return collectionTypeNamePairs;
}

function getTestTableNameToCollectionName(): Record<string, string> {
  if (!(isCodegen || isAnyTest)) {
    return {};
  }

  const testTableNameToCollectionName: Record<string, string> = {};
  const testHelpersPath = path.resolve(__dirname, "..", "sql", "tests", "testHelpers.ts");

  for (const { collectionName } of getCollectionTypeNamePairsFromFile(testHelpersPath)) {
    testTableNameToCollectionName[collectionName.toLowerCase()] = collectionName;
  }

  return testTableNameToCollectionName;
}

export function getCollectionTypeNameMaps(): CollectionTypeNameMaps {
  const collectionNameToTypeName: Record<string, string> = {};
  const typeNameToCollectionName: Record<string, string> = {};
  const tableNameToCollectionName: Record<string, string> = {};

  for (const { collectionName, typeName } of getCollectionTypeNamePairs()) {
    collectionNameToTypeName[collectionName] = typeName;
    typeNameToCollectionName[typeName] = collectionName;
    tableNameToCollectionName[collectionName.toLowerCase()] = collectionName;
  }

  return {
    collectionNameToTypeName,
    typeNameToCollectionName,
    tableNameToCollectionName,
    testTableNameToCollectionName: getTestTableNameToCollectionName(),
  };
}
