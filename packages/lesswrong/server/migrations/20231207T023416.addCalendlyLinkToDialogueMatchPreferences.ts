import DialogueMatchPreferences from "../../lib/collections/dialogueMatchPreferences/collection";
import { addField, dropField } from "./meta/utils";

/**
 * Generated on 2023-12-07T02:34:16.283Z by `yarn makemigrations`
 * The following schema changes were detected:
 * -------------------------------------------
 * diff --git a/proj/LWystuff/ForumMagnum/schema/accepted_schema.sql b/proj/LWystuff/ForumMagnum/schema/schema_to_accept.sql
 * index 358900abfc..6fd9b51671 100644
 * --- a/proj/LWystuff/ForumMagnum/schema/accepted_schema.sql
 * +++ b/proj/LWystuff/ForumMagnum/schema/schema_to_accept.sql
 * @@ -4,5 +4,3 @@
 *  --
 * --- Overall schema hash: 2ace126a36fc6b5cdb4e4a0264fec6f9
 * -
 * --- Accepted on 2023-12-04T23:54:04.000Z by 20231204T235404.fill_in_AbTestKey_and_make_nonnullable.ts
 * +-- Overall schema hash: f9ed62b00bc021de9a603a6bcb5f7367
 *  
 * @@ -264,3 +262,3 @@ CREATE TABLE "DialogueChecks" (
 *  
 * --- Schema for "DialogueMatchPreferences", hash: 8094e1a80428d3d3a5e6afcfd47e40ee
 * +-- Schema for "DialogueMatchPreferences", hash: 5086d9eb7832f42b1669fab949b865d2
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
export const acceptsSchemaHash = "f9ed62b00bc021de9a603a6bcb5f7367";

export const up = async ({db}: MigrationContext) => {
  if (DialogueMatchPreferences.isPostgres()) {
    await addField(db, DialogueMatchPreferences, "calendlyLink")
  }
}

export const down = async ({db}: MigrationContext) => {
  if (DialogueMatchPreferences.isPostgres()) {
    await dropField(db, DialogueMatchPreferences, "calendlyLink")
  }
}
