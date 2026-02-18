/**
 * Generated on 2023-11-16T19:57:24.761Z by `yarn makemigrations`
 * The following schema changes were detected:
 * -------------------------------------------
 * diff --git a/Users/habryka/Lightcone/ForumMagnum/schema/accepted_schema.sql b/Users/habryka/Lightcone/ForumMagnum/schema/schema_to_accept.sql
 * index 98a308bc1e..4b4d4fbe9d 100644
 * --- a/Users/habryka/Lightcone/ForumMagnum/schema/accepted_schema.sql
 * +++ b/Users/habryka/Lightcone/ForumMagnum/schema/schema_to_accept.sql
 * @@ -4,5 +4,3 @@
 *  --
 * --- Overall schema hash: 9c5c042b46b51d1c32bfe30cad147c81
 * -
 * --- Accepted on 2023-11-16T02:23:04.000Z by 20231116T022304.add_DialogueMatchPreferences_table.ts
 * +-- Overall schema hash: 4a83029d46e8b6afd17ced17bfeb6cf7
 *  
 * @@ -263,3 +261,3 @@ CREATE TABLE "DialogueChecks" (
 *  
 * --- Schema for "DialogueMatchPreferences", hash: 00ecc0712e874db689d7edf630fe33de
 * +-- Schema for "DialogueMatchPreferences", hash: 8094e1a80428d3d3a5e6afcfd47e40ee
 *  CREATE TABLE "DialogueMatchPreferences" (
 * @@ -267,3 +265,3 @@ CREATE TABLE "DialogueMatchPreferences" (
 *      "dialogueCheckId" varchar(27) NOT NULL,
 * -    "topicPreferences" jsonb[] NOT NULL,
 * +    "topicPreferences" jsonb[] NOT NULL DEFAULT '{}',
 *      "topicNotes" text NOT NULL DEFAULT '',
 * 
 * -------------------------------------------
 * (run `git diff --no-index schema/accepted_schema.sql schema/schema_to_accept.sql` to see this more clearly)
 *
 * - [ ] Write a migration to represent these changes
 * - [ ] Rename this file to something more readable
 * - [ ] Uncomment `acceptsSchemaHash` below
 * - [ ] Run `yarn acceptmigrations` to update the accepted schema hash (running makemigrations again will also do this)
 */
export const acceptsSchemaHash = "4a83029d46e8b6afd17ced17bfeb6cf7";

import DialogueMatchPreferences from "../../server/collections/dialogueMatchPreferences/collection"
import { createTable, dropTable } from "./meta/utils"

export const up = async ({db}: MigrationContext) => {
  await createTable(db, DialogueMatchPreferences);
}

export const down = async ({db}: MigrationContext) => {
  await dropTable(db, DialogueMatchPreferences);
}
