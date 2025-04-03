import chai from 'chai';
import { getSchema } from "@/lib/schema/allSchemas";
import { getAllCollections } from "@/server/collections/allCollections";
import isArray from "lodash/isArray";

describe("graphql schemas", () => {
  it("Has all permissions-gated fields nullable", () => {
    const collections = getAllCollections();
    const badFields: string[] = [];

    for (const collection of collections) {
      const schema = getSchema(collection.collectionName);
      for (const [name,field] of Object.entries(schema)) {
        if (field.graphql) {
          const dbNullable = field.database?.nullable;
          const permissionsGated = field.graphql.canRead && !permissionsAllowGuest(field.graphql.canRead);
          const outputType = field.graphql.outputType;
          const graphqlNullable = (typeof outputType !== 'string') || !outputType.endsWith("!");
          if ((dbNullable || permissionsGated) && !graphqlNullable) {
            badFields.push(`${collection.collectionName}.${name}`);
          }
        }
      }
    }
    
    if (badFields.length > 0) {
      console.error(`The following fields have a non-nullable graphql type, but have a nullable database type or a restrictive permission that means the field will be missing for some users:\n${badFields.join("\n")}`);
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