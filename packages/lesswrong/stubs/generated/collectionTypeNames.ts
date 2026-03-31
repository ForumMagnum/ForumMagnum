import { isAnyTest, isIntegrationTest } from "@/lib/executionEnvironment";
import { getCollectionTypeNameMaps } from "@/server/codegen/collectionTypeNameMaps";

const {
  collectionNameToTypeName,
  typeNameToCollectionName,
  tableNameToCollectionName: baseTableNameToCollectionName,
  testTableNameToCollectionName,
} = getCollectionTypeNameMaps();

export { collectionNameToTypeName, typeNameToCollectionName };

export const tableNameToCollectionName = {
  ...baseTableNameToCollectionName,
  ...((isAnyTest && !isIntegrationTest) ? testTableNameToCollectionName : {}),
};
