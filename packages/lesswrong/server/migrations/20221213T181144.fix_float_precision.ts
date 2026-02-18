/**
 * Generated on 2022-12-13T18:11:44.150Z by `yarn makemigrations`
 * The following schema changes were detected:
 * -------------------------------------------
 * ***Diff too large to display***
 * -------------------------------------------
 * (run `git diff --no-index schema/accepted_schema.sql schema/schema_to_accept.sql` to see this more clearly)
 *
 * - [ ] Write a migration to represent these changes
 * - [ ] Rename this file to something more readable if you wish
 * - [ ] Uncomment `acceptsSchemaHash` below
 * - [ ] Run `yarn acceptmigrations` to update the accepted schema hash (running makemigrations again will also do this)
 */
export const acceptsSchemaHash = "9ff9e6371051f8d49cac5770b07dc0d8";

// The original migration here is commented out as it is incompatible with
// after adding views to the schema - it was sufficiently long ago that it's no
// longer needed anyway.
export const up = async () => {}

/*
import { FloatType } from "../../server/sql/Type";
import { getAllCollections } from "../vulcan-lib";
import { updateFieldType } from "./meta/utils";

export const up = async ({db}: MigrationContext) => {
  const collections = getAllCollections();
  for (const collection of collections) {
    const fields = collection.getTable().getFields();
    for (const fieldName in fields) {
      const type = fields[fieldName];
      if (type.toConcrete() instanceof FloatType) {
        await updateFieldType(db, collection, fieldName);
      }
    }
  }
}
*/
