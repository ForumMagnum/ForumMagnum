/**
 * Generated on 2023-12-08T02:17:26.238Z by `yarn makemigrations`
 * The following schema changes were detected:
 * -------------------------------------------
 * diff --git a/Users/jacob/Documents/lw_big/ForumMagnum/schema/accepted_schema.sql b/Users/jacob/Documents/lw_big/ForumMagnum/schema/schema_to_accept.sql
 * index becc8f95ce..834a6fe7f3 100644
 * --- a/Users/jacob/Documents/lw_big/ForumMagnum/schema/accepted_schema.sql
 * +++ b/Users/jacob/Documents/lw_big/ForumMagnum/schema/schema_to_accept.sql
 * @@ -4,5 +4,3 @@
 *  --
 * --- Overall schema hash: a09712836b72d69f7456155ccc81ac83
 * -
 * --- Accepted on 2023-12-08T00:40:14.000Z by 20231208T004014.addCalendlyLinkDialogueMatchPreferencesField.ts
 * +-- Overall schema hash: 989958afb8a5cef47f6f8bd33d5a499f
 *  
 * @@ -264,3 +262,3 @@ CREATE TABLE "DialogueChecks" (
 *  
 * --- Schema for "DialogueMatchPreferences", hash: 9dd09046585554d903ea22ac959ca687
 * +-- Schema for "DialogueMatchPreferences", hash: 76d8a80190a5d81b2ccef5cd69ebcabf
 *  CREATE TABLE "DialogueMatchPreferences" (
 * @@ -275,2 +273,3 @@ CREATE TABLE "DialogueMatchPreferences" (
 *      "generatedDialogueId" text,
 * +    "deleted" bool NOT NULL DEFAULT false,
 *      "schemaVersion" double precision NOT NULL DEFAULT 1,
 * 
 * -------------------------------------------
 * (run `git diff --no-index schema/accepted_schema.sql schema/schema_to_accept.sql` to see this more clearly)
 *
 * - [X] Write a migration to represent these changes
 * - [X] Rename this file to something more readable
 * - [X] Uncomment `acceptsSchemaHash` below
 * - [X] Run `yarn acceptmigrations` to update the accepted schema hash (running makemigrations again will also do this)
 */
export const acceptsSchemaHash = "989958afb8a5cef47f6f8bd33d5a499f";

import DialogueMatchPreferences from "../../lib/collections/dialogueMatchPreferences/collection"
import { addField, dropField } from "./meta/utils"

export const up = async ({db}: MigrationContext) => {
  await addField(db, DialogueMatchPreferences, "deleted")
}

export const down = async ({db}: MigrationContext) => {
  await dropField(db, DialogueMatchPreferences, "deleted")
}
