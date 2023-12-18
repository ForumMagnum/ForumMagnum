/**
 * Generated on 2023-12-08T00:40:14.291Z by `yarn makemigrations`
 * The following schema changes were detected:
 * -------------------------------------------
 * diff --git a/ForumMagnum/schema/accepted_schema.sql b/ForumMagnum/schema/schema_to_accept.sql
 * index 6f07da63d1..63b16b0761 100644
 * --- a/ForumMagnum/schema/accepted_schema.sql
 * +++ b/ForumMagnum/schema/schema_to_accept.sql
 * @@ -4,5 +4,3 @@
 *  --
 * --- Overall schema hash: d8ecd5f29746164d6bf5b3e064f241ac
 * -
 * --- Accepted on 2023-12-05T20:44:12.000Z by 20231205T204412.make_fields_not_nullable.ts
 * +-- Overall schema hash: a09712836b72d69f7456155ccc81ac83
 *  
 * @@ -264,3 +262,3 @@ CREATE TABLE "DialogueChecks" (
 *  
 * --- Schema for "DialogueMatchPreferences", hash: 325410e7914d56531d839fc137cf22f0
 * +-- Schema for "DialogueMatchPreferences", hash: 9dd09046585554d903ea22ac959ca687
 *  CREATE TABLE "DialogueMatchPreferences" (
 * @@ -273,2 +271,3 @@ CREATE TABLE "DialogueMatchPreferences" (
 *      "formatNotes" text NOT NULL DEFAULT '',
 * +    "calendlyLink" text,
 *      "generatedDialogueId" text,
 * 
 * -------------------------------------------
 * (run `git diff --no-index schema/accepted_schema.sql schema/schema_to_accept.sql` to see this more clearly)
 *
 * - [x] Write a migration to represent these changes
 * - [x] Rename this file to something more readable
 * - [x] Uncomment `acceptsSchemaHash` below
 * - [x] Run `yarn acceptmigrations` to update the accepted schema hash (running makemigrations again will also do this)
 */
export const acceptsSchemaHash = "a09712836b72d69f7456155ccc81ac83";

import DialogueMatchPreferences from "../../lib/collections/dialogueMatchPreferences/collection";
import { addField, dropField } from "./meta/utils";

export const up = async ({db}: MigrationContext) => {
  await addField(db, DialogueMatchPreferences, "calendlyLink")
}

export const down = async ({db}: MigrationContext) => {
  await dropField(db, DialogueMatchPreferences, "calendlyLink")
}
