/**
 * Generated on 2023-10-27T21:32:16.260Z by `yarn makemigrations`
 * The following schema changes were detected:
 * -------------------------------------------
 * diff --git a/Users/jacob/Documents/lw_big/ForumMagnum/schema/accepted_schema.sql b/Users/jacob/Documents/lw_big/ForumMagnum/schema/schema_to_accept.sql
 * index 9af26487dc..2f8737b589 100644
 * --- a/Users/jacob/Documents/lw_big/ForumMagnum/schema/accepted_schema.sql
 * +++ b/Users/jacob/Documents/lw_big/ForumMagnum/schema/schema_to_accept.sql
 * @@ -4,5 +4,3 @@
 *  --
 * --- Overall schema hash: ccc15da1a7699b6fb4cbacde8bd63bef
 * -
 * --- Accepted on 2023-10-26T01:47:47.000Z by 20231026T014747.dialogue_facilitation_offer.ts
 * +-- Overall schema hash: 2e0ba043f057e511aa882172641097b4
 *  
 * @@ -250,2 +248,14 @@ CREATE TABLE "DebouncerEvents" (
 *  
 * +-- Schema for "DialogueChecks", hash: c797d0d29c421c6e211b0a8591b211b9
 * +CREATE TABLE "DialogueChecks" (
 * +    _id varchar(27) PRIMARY KEY,
 * +    "userId" text NOT NULL,
 * +    "targetUserId" text NOT NULL,
 * +    "checked" bool NOT NULL DEFAULT false,
 * +    "checkedAt" timestamptz NOT NULL,
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
 * - [X] Write a migration to represent these changes
 * - [X] Rename this file to something more readable
 * - [X] Uncomment `acceptsSchemaHash` below
 * - [X] Run `yarn acceptmigrations` to update the accepted schema hash (running makemigrations again will also do this)
 */
export const acceptsSchemaHash = "2e0ba043f057e511aa882172641097b4";

import DialogueCheck from "../../lib/collections/dialogueChecks/collection";
import { createTable, dropTable } from "./meta/utils";

export const up = async ({db}: MigrationContext) => {
  if (DialogueCheck.isPostgres()) {
    await createTable(db, DialogueCheck);
  }
}

export const down = async ({db}: MigrationContext) => {
  if (DialogueCheck.isPostgres()) {
    await dropTable(db, DialogueCheck);
  }
}
