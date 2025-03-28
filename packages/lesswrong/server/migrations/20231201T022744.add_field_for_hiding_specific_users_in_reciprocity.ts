/**
 * Generated on 2023-12-01T02:27:44.904Z by `yarn makemigrations`
 * The following schema changes were detected:
 * -------------------------------------------
 * diff --git a/Users/jacob/Documents/lw_big/ForumMagnum/schema/accepted_schema.sql b/Users/jacob/Documents/lw_big/ForumMagnum/schema/schema_to_accept.sql
 * index edd1c17bee..0aabf30b3c 100644
 * --- a/Users/jacob/Documents/lw_big/ForumMagnum/schema/accepted_schema.sql
 * +++ b/Users/jacob/Documents/lw_big/ForumMagnum/schema/schema_to_accept.sql
 * @@ -4,5 +4,3 @@
 *  --
 * --- Overall schema hash: edca7fde4fce09bf9031f2f3f9b18fda
 * -
 * --- Accepted on 2023-11-30T14:04:04.000Z by 20231130T140404.add_submissionComments.ts
 * +-- Overall schema hash: 2d5747e2acdbe83c754cbbda258623ed
 *  
 * @@ -251,3 +249,3 @@ CREATE TABLE "DebouncerEvents" (
 *  
 * --- Schema for "DialogueChecks", hash: 66f51efd1a8291432d232620b2979ede
 * +-- Schema for "DialogueChecks", hash: ebfbe6201ff8409ac44430c6e41d222c
 *  CREATE TABLE "DialogueChecks" (
 * @@ -258,3 +256,3 @@ CREATE TABLE "DialogueChecks" (
 *      "checkedAt" timestamptz NOT NULL,
 * -    "hideInRecommendations" bool NOT NULL,
 * +    "hideInRecommendations" bool NOT NULL DEFAULT false,
 *      "schemaVersion" double precision DEFAULT 1,
 * @@ -1541 +1539,2 @@ CREATE OR REPLACE FUNCTION fm_comment_confidence(
 *    ;
 * +
 * 
 * -------------------------------------------
 * (run `git diff --no-index schema/accepted_schema.sql schema/schema_to_accept.sql` to see this more clearly)
 *
 * - [X] Write a migration to represent these changes
 * - [X] Rename this file to something more readable
 * - [X] Uncomment `acceptsSchemaHash` below
 * - [X] Run `yarn acceptmigrations` to update the accepted schema hash (running makemigrations again will also do this)
 */
export const acceptsSchemaHash = "2d5747e2acdbe83c754cbbda258623ed";

import DialogueChecks from "../../server/collections/dialogueChecks/collection"
import { addField, dropField } from "./meta/utils"

export const up = async ({db}: MigrationContext) => {
  await addField(db, DialogueChecks, "hideInRecommendations")
}

export const down = async ({db}: MigrationContext) => {
  await dropField(db, DialogueChecks, "hideInRecommendations")
}
