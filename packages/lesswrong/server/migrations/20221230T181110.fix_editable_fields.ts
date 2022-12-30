/**
 * Generated on 2022-12-30T18:11:10.051Z by `yarn makemigrations`
 * The following schema changes were detected:
 * -------------------------------------------
 * ***Diff too large to display***
 * -------------------------------------------
 * (run `git diff --no-index schema/accepted_schema.sql schema/schema_to_accept.sql` to see this more clearly)
 *
 * - [x] Write a migration to represent these changes
 * - [ ] Rename this file to something more readable if you wish
 * - [x] Uncomment `acceptsSchemaHash` below
 * - [ ] Run `yarn acceptmigrations` to update the accepted schema hash (running makemigrations again will also do this)
 */
export const acceptsSchemaHash = "ca6355fc4797fdc6049c10e0a9dbb947";

import Spotlights from "../../lib/collections/spotlights/collection"
import Tags from "../../lib/collections/tags/collection"
import PgCollection from "../../lib/sql/PgCollection"
import Users from "../../lib/vulcan-users"
import { addField } from "./meta/utils"

export const up = async ({db}: MigrationContext) => {
  const collectionsAndFieldsToMigrate = [
    {collection: Spotlights, fieldName: 'description'},
    {collection: Tags, fieldName: 'description'},
    {collection: Tags, fieldName: 'subforumWelcomeText'},
    {collection: Users, fieldName: 'howOthersCanHelpMe'},
    {collection: Users, fieldName: 'howICanHelpOthers'},
    {collection: Users, fieldName: 'biography'},
  ]
  for (const {collection, fieldName} of collectionsAndFieldsToMigrate) {
    if (collection.isPostgres()) {
      // Hand-jamming these types, it was annoying to do it properly, and we can
      // tell they're correct by looking just above
      await addField(db, collection as  PgCollection<DbObject>, fieldName as keyof DbObject);
      
      // TODO: migrate data
    }
  }
}

export const down = async ({db}: MigrationContext) => {
  // Nah
}
