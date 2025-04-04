import chai from 'chai';
import { getSchema } from "@/lib/schema/allSchemas";
import { getAllCollections, getCollection, isValidCollectionName } from "@/server/collections/allCollections";
import isArray from "lodash/isArray";
import { getCollectionAccessFilter } from '@/server/permissions/accessFilters';
import { typeNameToCollectionName } from '@/lib/generated/collectionTypeNames';

type FieldProblem = {
  collectionName: string
  fieldName: string
  message: string
}

describe("graphql schemas", () => {
  it("Has all permissions-gated fields nullable", () => {
    const collections = getAllCollections();
    const badFields: FieldProblem[] = [];

    for (const collection of collections) {
      const schema = getSchema(collection.collectionName);
      for (const [name,field] of Object.entries(schema)) {
        if (field.graphql) {
          const dbNullable = field.database?.nullable;
          const fieldPermissionsGated = field.graphql.canRead && !permissionsAllowGuest(field.graphql.canRead);
          const outputType = field.graphql.outputType;
          const graphqlNullable = (typeof outputType !== 'string') || !outputType.endsWith("!");
          if (!graphqlNullable) {
            if (dbNullable) {
              badFields.push({
                collectionName: collection.collectionName,
                fieldName: name,
                message: "GraphQL outputType is not-nullable, but the corresponding database field is nullable"
              });
            }
            if (fieldPermissionsGated) {
              badFields.push({
                collectionName: collection.collectionName,
                fieldName: name,
                message: "GraphQL outputType is not-nullable, but the field is permissions-gated"
              });
            }
          }
          if (typeof outputType === 'string' && outputType.endsWith("!")) {
            const typeName = outputType.substring(0, outputType.length-1);
            const maybeCollectionName = (typeNameToCollectionName as any)[typeName] ?? null;
            if (isValidCollectionName(maybeCollectionName)
              && collectionHasRowLevelPermissions(maybeCollectionName))
            {
              badFields.push({
                collectionName: collection.collectionName,
                fieldName: name,
                message: "GraphQL output is not-nullable, but points to a collection that has an access filter"
              });
            }
          }
        }
      }
    }
    
    if (badFields.length > 0) {
      console.error(`The following fields have a non-nullable graphql type, but have a nullable database type or a restrictive permission that means the field will be missing for some users:\n${badFields.map(f => `${f.collectionName}.${f.fieldName}: ${f.message}`).join("\n")}`);
      chai.assert.equal(badFields.length, 0);
    }
  })
});

export function permissionsAllowGuest(permissions: FieldPermissions) {
  if (permissions === 'guests') {
    return true;
  }
  if (isArray(permissions)) {
    for (const perm of permissions) {
      if (permissionsAllowGuest(perm)) {
        return true;
      }
    }
  }
  return false;
}

function collectionHasRowLevelPermissions(collectionName: CollectionNameString) {
  return !!getCollectionAccessFilter(collectionName);
}

