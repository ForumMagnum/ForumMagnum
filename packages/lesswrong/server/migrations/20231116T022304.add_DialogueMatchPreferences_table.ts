/**
 * Generated on 2023-11-16T02:23:04.013Z by `yarn makemigrations`
 * The following schema changes were detected:
 * -------------------------------------------
 * diff --git a/ForumMagnum/schema/accepted_schema.sql b/ForumMagnum/schema/schema_to_accept.sql
 * index 23393012af..c3bf8a5266 100644
 * --- a/ForumMagnum/schema/accepted_schema.sql
 * +++ b/ForumMagnum/schema/schema_to_accept.sql
 * @@ -4,5 +4,3 @@
 *  --
 * --- Overall schema hash: 559874dae2627ec571ac2748d5cf6bc2
 * -
 * --- Accepted on 2023-11-16T01:09:48.000Z by 20231116T010948.update_karma_default_value.ts
 * +-- Overall schema hash: 9c5c042b46b51d1c32bfe30cad147c81
 *  
 * @@ -263,3 +261,3 @@ CREATE TABLE "DialogueChecks" (
 *  
 * --- Schema for "DialogueMatchPreferences", hash: a9cc1917510c2a758fc457f236080aa2
 * +-- Schema for "DialogueMatchPreferences", hash: 00ecc0712e874db689d7edf630fe33de
 *  CREATE TABLE "DialogueMatchPreferences" (
 * @@ -267,2 +265,3 @@ CREATE TABLE "DialogueMatchPreferences" (
 *      "dialogueCheckId" varchar(27) NOT NULL,
 * +    "topicPreferences" jsonb[] NOT NULL,
 *      "topicNotes" text NOT NULL DEFAULT '',
 * 
 * -------------------------------------------
 * (run `git diff --no-index schema/accepted_schema.sql schema/schema_to_accept.sql` to see this more clearly)
 *
 * - [x] Write a migration to represent these changes
 * - [x] Rename this file to something more readable
 * - [x] Uncomment `acceptsSchemaHash` below
 * - [] Run `yarn acceptmigrations` to update the accepted schema hash (running makemigrations again will also do this)
 */
export const acceptsSchemaHash = "9c5c042b46b51d1c32bfe30cad147c81";

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
