/**
 * Generated on 2023-11-03T20:20:08.337Z by `yarn makemigrations`
 * The following schema changes were detected:
 * -------------------------------------------
 * diff --git a/ForumMagnum/schema/accepted_schema.sql b/ForumMagnum/schema/schema_to_accept.sql
 * index 7510af1d0d..36814d2ac7 100644
 * --- a/ForumMagnum/schema/accepted_schema.sql
 * +++ b/ForumMagnum/schema/schema_to_accept.sql
 * @@ -4,5 +4,3 @@
 *  --
 * --- Overall schema hash: ee9f40a8166012becef3bf0f5a9726b0
 * -
 * --- Accepted on 2023-10-28T01:20:12.000Z by 20231028T012012.add_notificationAddedAsCoauthor.ts
 * +-- Overall schema hash: 1e3a27dd5e7df23c64a524f8fdef9856
 *  
 * @@ -121,3 +119,3 @@ CREATE TABLE "CommentModeratorActions" (
 *  
 * --- Schema for "Comments", hash: 84b8fb0665229242c2162a605ef4bb34
 * +-- Schema for "Comments", hash: e8c4560c2d87989e29048a433dac68f2
 *  CREATE TABLE "Comments" (
 * @@ -183,2 +181,3 @@ CREATE TABLE "Comments" (
 *      "agentFoundationsId" text,
 * +    "originalDialogueId" varchar(27),
 *      "schemaVersion" double precision DEFAULT 1,
 * 
 * -------------------------------------------
 * (run `git diff --no-index schema/accepted_schema.sql schema/schema_to_accept.sql` to see this more clearly)
 *
 * - [x] Write a migration to represent these changes
 * - [x] Rename this file to something more readable
 * - [x] Uncomment `acceptsSchemaHash` below
 * - [x] Run `yarn acceptmigrations` to update the accepted schema hash (running makemigrations again will also do this)
 */
export const acceptsSchemaHash = "e02a31666a33984e158e485e3a0c5f30";

import { Comments } from "../../lib/collections/comments/collection";
import { addField, dropField } from "./meta/utils";

export const up = async ({db}: MigrationContext) => {
  await addField(db, Comments, 'originalDialogueId');
}

export const down = async ({db}: MigrationContext) => {
  await dropField(db, Comments, 'originalDialogueId');
}
