/**
 * Generated on 2023-11-30T20:56:41.681Z by `yarn makemigrations`
 * The following schema changes were detected:
 * -------------------------------------------
 * diff --git a/Users/jacob/Documents/lw_big/ForumMagnum/schema/accepted_schema.sql b/Users/jacob/Documents/lw_big/ForumMagnum/schema/schema_to_accept.sql
 * index 74f2512cc4..67027bfc03 100644
 * --- a/Users/jacob/Documents/lw_big/ForumMagnum/schema/accepted_schema.sql
 * +++ b/Users/jacob/Documents/lw_big/ForumMagnum/schema/schema_to_accept.sql
 * @@ -4,5 +4,3 @@
 *  --
 * --- Overall schema hash: ea10555b6fef67efb7ab0cbbdfdb8772
 * -
 * --- Accepted on 2023-11-30T01:26:54.000Z by 20231130T012654.changeDefaultNewCheckNotificationFrequencyRealtime.ts
 * +-- Overall schema hash: 9d8e4b7e7411e789f2a9a193fd78ce2b
 *  
 * @@ -251,3 +249,3 @@ CREATE TABLE "DebouncerEvents" (
 *  
 * --- Schema for "DialogueChecks", hash: c797d0d29c421c6e211b0a8591b211b9
 * +-- Schema for "DialogueChecks", hash: 66f51efd1a8291432d232620b2979ede
 *  CREATE TABLE "DialogueChecks" (
 * @@ -258,2 +256,3 @@ CREATE TABLE "DialogueChecks" (
 *      "checkedAt" timestamptz NOT NULL,
 * +    "hideInRecommendations" bool NOT NULL,
 *      "schemaVersion" double precision DEFAULT 1,
 * 
 * -------------------------------------------
 * (run `git diff --no-index schema/accepted_schema.sql schema/schema_to_accept.sql` to see this more clearly)
 *
 * - [X] Write a migration to represent these changes
 * - [X] Rename this file to something more readable
 * - [X] Uncomment `acceptsSchemaHash` below
 * - [X] Run `yarn acceptmigrations` to update the accepted schema hash (running makemigrations again will also do this)
 */
export const acceptsSchemaHash = "9d8e4b7e7411e789f2a9a193fd78ce2b";

import DialogueChecks from "../../lib/collections/dialogueChecks/collection"
import { addField, dropField } from "./meta/utils"

export const up = async ({db}: MigrationContext) => {
  if (DialogueChecks.isPostgres()) {
    await addField(db, DialogueChecks, "hideInRecommendations")
  }
}

export const down = async ({db}: MigrationContext) => {
  if (DialogueChecks.isPostgres()) {
    await dropField(db, DialogueChecks, "hideInRecommendations")
  }
}
