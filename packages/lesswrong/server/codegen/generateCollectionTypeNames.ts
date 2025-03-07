import { getAllCollections } from "@/server/collections/allCollections";
import { testCollections } from "../sql/tests/testHelpers";

// Generate mappings from collection name to type name and vice versa
export function generateCollectionTypeNames(): string {
  const sb: Array<string> = [];
  const collections = getAllCollections();
  sb.push(`import { isAnyTest } from '@/lib/executionEnvironment';`);

  sb.push(`export const collectionNameToTypeName = {`);
  for (let collection of collections) {
    sb.push(`  ${collection.collectionName}: '${collection.typeName}',`);
  }
  sb.push(`} as const;\n`);

  sb.push(`export const typeNameToCollectionName = {`);
  for (let collection of collections) {
    sb.push(`  ${collection.typeName}: '${collection.collectionName}',`);
  }
  sb.push(`} as const;\n`);

  sb.push(`export const tableNameToCollectionName = {`);
  for (let collection of collections) {
    sb.push(`  ${collection.collectionName.toLowerCase()}: '${collection.collectionName}',`);
  }
  sb.push(`  ...(isAnyTest ? {`);
  for (let collection of Object.values(testCollections)) {
    sb.push(`    ${collection.collectionName.toLowerCase()}: '${collection.collectionName}',`);
  }
  sb.push(`  } : {}),`);
  sb.push(`} as const;\n`);

  return sb.join('\n');
}
