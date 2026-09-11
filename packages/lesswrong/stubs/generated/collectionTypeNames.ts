import { isAnyTest, isIntegrationTest } from "@/lib/executionEnvironment";
import { getCollectionTypeNameMaps } from "@/server/codegen/collectionTypeNameMaps";

const {
  collectionNameToTypeName,
  typeNameToCollectionName,
  tableNameToCollectionName: baseTableNameToCollectionName,
  testCollectionNameToTypeName,
  testTypeNameToCollectionName,
  testTableNameToCollectionName,
} = getCollectionTypeNameMaps();

export const collectionNameToTypeNameWithTests = {
  ...collectionNameToTypeName,
  ...((isAnyTest && !isIntegrationTest) ? testCollectionNameToTypeName : {}),
};

export const typeNameToCollectionNameWithTests = {
  ...typeNameToCollectionName,
  ...((isAnyTest && !isIntegrationTest) ? testTypeNameToCollectionName : {}),
};

export {
  collectionNameToTypeNameWithTests as collectionNameToTypeName,
  typeNameToCollectionNameWithTests as typeNameToCollectionName,
};

export const tableNameToCollectionName = {
  ...baseTableNameToCollectionName,
  ...((isAnyTest && !isIntegrationTest) ? testTableNameToCollectionName : {}),
};
