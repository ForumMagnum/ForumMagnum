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
export const acceptsSchemaHash = "ea71916ffaa87ae0a21302ce831261e6";

import Spotlights from "../../server/collections/spotlights/collection"
import Tags from "../../server/collections/tags/collection"
import Users from "../../server/collections/users/collection"
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
    // eslint-disable-next-line no-console
    console.log(`Migrating ${collection.collectionName} ${fieldName}`);

    await addField(db, collection, fieldName as keyof DbObject);

    // -- Migrate data --
    const ids = await db.any(`SELECT _id FROM "${collection.collectionName}"`);

    // eslint-disable-next-line no-console
    console.log(`  Updating ${ids.length} documents`);

    const promises: Promise<null>[] = [];
    for (const {_id} of ids) {
      promises.push(db.none(`
        UPDATE "${collection.collectionName}"
        SET "${fieldName}" = (
          SELECT row_to_json(q.*)
          FROM (
            SELECT
              r."html",
              r."userId",
              r."version",
              r."editedAt",
              r."wordCount",
              r."updateType",
              r."commitMessage",
              r."originalContents"
            FROM "Revisions" r
            JOIN "${collection.collectionName}" t ON
              t."_id" = $1 AND
              t."${fieldName}_latest" = r."_id") q
          )
        WHERE "_id" = $1
      `, [_id]));
    }
    await Promise.all(promises);

    // eslint-disable-next-line no-console
    console.log("    Done!");
  }
}

export const down = async (_: MigrationContext) => {
  // Nah
}
