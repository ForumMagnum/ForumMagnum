/**
 * Generated on 2023-11-09T21:27:10.333Z by `yarn makemigrations`
 * The following schema changes were detected:
 * -------------------------------------------
 * diff --git a/Users/robert/Documents/repos/ForumMagnum/schema/accepted_schema.sql b/Users/robert/Documents/repos/ForumMagnum/schema/schema_to_accept.sql
 * index c48eec1746..964b06522e 100644
 * --- a/Users/robert/Documents/repos/ForumMagnum/schema/accepted_schema.sql
 * +++ b/Users/robert/Documents/repos/ForumMagnum/schema/schema_to_accept.sql
 * @@ -4,5 +4,3 @@
 *  --
 * --- Overall schema hash: ee6df59dfe7fc9440ca415ce5cb2d762
 * -
 * --- Accepted on 2023-11-08T11:00:35.000Z by 20231108T110035.add_fundraiser_amounts.ts
 * +-- Overall schema hash: 9ca594e732abb9886c3f39784104f054
 *  
 * @@ -263,2 +261,15 @@ CREATE TABLE "DialogueChecks" (
 *  
 * +-- Schema for "DialogueMatchPreferences", hash: fbd9b67f7fa306a514d41f5bda1d7542
 * +CREATE TABLE "DialogueMatchPreferences" (
 * +    _id varchar(27) PRIMARY KEY,
 * +    "dialogueCheckId" varchar(27) NOT NULL,
 * +    "topicNotes" text NOT NULL DEFAULT '',
 * +    "syncPreference" text NOT NULL,
 * +    "asyncPreference" text NOT NULL,
 * +    "formatNotes" text NOT NULL DEFAULT '',
 * +    "schemaVersion" double precision DEFAULT 1,
 * +    "createdAt" timestamptz DEFAULT CURRENT_TIMESTAMP,
 * +    "legacyData" jsonb
 * +);
 * +
 *  -- Schema for "DigestPosts", hash: fb8d9230b033323f61ec3b5039a2d588
 * 
 * -------------------------------------------
 * (run `git diff --no-index schema/accepted_schema.sql schema/schema_to_accept.sql` to see this more clearly)
 *
 * - [ ] Write a migration to represent these changes
 * - [ ] Rename this file to something more readable
 * - [ ] Uncomment `acceptsSchemaHash` below
 * - [ ] Run `yarn acceptmigrations` to update the accepted schema hash (running makemigrations again will also do this)
 */
export const acceptsSchemaHash = "f3edfafda2c7f4e5b320c267a3d1bf5a";

import DialogueMatchPreferences from "../../lib/collections/dialogueMatchPreferences/collection"
import { createTable, dropTable } from "./meta/utils"

export const up = async ({db}: MigrationContext) => {
  if (DialogueMatchPreferences.isPostgres()) {
    await createTable(db, DialogueMatchPreferences);
  }
}

export const down = async ({db}: MigrationContext) => {
  if (DialogueMatchPreferences.isPostgres()) {
    await dropTable(db, DialogueMatchPreferences);
  }
}
