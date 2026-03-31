import { getCollectionTypeNameMaps } from "./collectionTypeNameMaps";

// Generate mappings from collection name to type name and vice versa
export function generateCollectionTypeNames(): string {
  const sb: Array<string> = [];
  const {
    collectionNameToTypeName,
    typeNameToCollectionName,
    tableNameToCollectionName,
    testCollectionNameToTypeName,
    testTypeNameToCollectionName,
    testTableNameToCollectionName,
  } = getCollectionTypeNameMaps();

  sb.push(`import { isAnyTest, isIntegrationTest } from '@/lib/executionEnvironment';\n`);

  sb.push(`export const collectionNameToTypeName = {`);
  for (const [collectionName, typeName] of Object.entries(collectionNameToTypeName)) {
    sb.push(`  ${collectionName}: '${typeName}',`);
  }
  sb.push(`  ...((isAnyTest && !isIntegrationTest) ? {`);
  for (const [collectionName, typeName] of Object.entries(testCollectionNameToTypeName)) {
    sb.push(`    ${collectionName}: '${typeName}',`);
  }
  sb.push(`  } : {}),`);
  sb.push(`} as const;\n`);

  sb.push(`export const typeNameToCollectionName = {`);
  for (const [typeName, collectionName] of Object.entries(typeNameToCollectionName)) {
    sb.push(`  ${typeName}: '${collectionName}',`);
  }
  sb.push(`  ...((isAnyTest && !isIntegrationTest) ? {`);
  for (const [typeName, collectionName] of Object.entries(testTypeNameToCollectionName)) {
    sb.push(`    ${typeName}: '${collectionName}',`);
  }
  sb.push(`  } : {}),`);
  sb.push(`} as const;\n`);

  sb.push(`export const tableNameToCollectionName = {`);
  for (const [tableName, collectionName] of Object.entries(tableNameToCollectionName)) {
    sb.push(`  ${tableName}: '${collectionName}',`);
  }
  sb.push(`  ...((isAnyTest && !isIntegrationTest) ? {`);
  for (const [tableName, collectionName] of Object.entries(testTableNameToCollectionName)) {
    sb.push(`    ${tableName}: '${collectionName}',`);
  }
  sb.push(`  } : {}),`);
  sb.push(`} as const;\n`);

  return sb.join('\n');
}
