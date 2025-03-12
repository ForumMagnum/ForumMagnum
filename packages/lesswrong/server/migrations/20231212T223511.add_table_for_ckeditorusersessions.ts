/**
 * Generated on 2023-12-12T22:35:11.497Z by `yarn makemigrations`
 * The following schema changes were detected:
 * -------------------------------------------
 * diff --git a/Users/jacob/Documents/lw_big/ForumMagnum/schema/accepted_schema.sql b/Users/jacob/Documents/lw_big/ForumMagnum/schema/schema_to_accept.sql
 * index a060619d8c..b0b7d5f5df 100644
 * --- a/Users/jacob/Documents/lw_big/ForumMagnum/schema/accepted_schema.sql
 * +++ b/Users/jacob/Documents/lw_big/ForumMagnum/schema/schema_to_accept.sql
 * @@ -4,5 +4,3 @@
 *  --
 * --- Overall schema hash: 989958afb8a5cef47f6f8bd33d5a499f
 * -
 * --- Accepted on 2023-12-08T02:17:26.000Z by 20231208T021726.add_soft_delete_to_forms.ts
 * +-- Overall schema hash: e30b5ca4f4989161f627585b747ee83e
 *  
 * @@ -81,2 +79,13 @@ CREATE TABLE "Chapters" (
 *  
 * +-- Schema for "CkEditorUserSessions", hash: b9eaf9c72e9640972611847068931528
 * +CREATE TABLE "CkEditorUserSessions" (
 * +    _id varchar(27) PRIMARY KEY,
 * +    "documentId" text NOT NULL,
 * +    "userId" text NOT NULL,
 * +    "endedAt" timestamptz,
 * +    "schemaVersion" double precision NOT NULL DEFAULT 1,
 * +    "createdAt" timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
 * +    "legacyData" jsonb
 * +);
 * +
 *  -- Schema for "ClientIds", hash: dfb103acdd47efe3095b6b37647334f8
 * 
 * -------------------------------------------
 * (run `git diff --no-index schema/accepted_schema.sql schema/schema_to_accept.sql` to see this more clearly)
 *
 * - [X] Write a migration to represent these changes
 * - [X] Rename this file to something more readable
 * - [X] Uncomment `acceptsSchemaHash` below
 * - [X] Run `yarn acceptmigrations` to update the accepted schema hash (running makemigrations again will also do this)
 */
export const acceptsSchemaHash = "e30b5ca4f4989161f627585b747ee83e";

import { createTable, dropTable } from "./meta/utils";
import CkEditorUserSession from "../../server/collections/ckEditorUserSessions/collection";

export const up = async ({db}: MigrationContext) => {
  await createTable(db, CkEditorUserSession);
}

export const down = async ({db}: MigrationContext) => {
  await dropTable(db, CkEditorUserSession);
}
