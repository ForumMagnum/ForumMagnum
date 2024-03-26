import ArbitalCaches from "../../lib/collections/arbitalCache/collection";
import { createTable } from "./meta/utils";

/**
 * Generated on 2024-03-26T18:23:16.022Z by `yarn makemigrations`
 * The following schema changes were detected:
 * -------------------------------------------
 * diff --git a/Users/jbabcock/repositories/Lesserwrong/alt-LessWrong2/schema/accepted_schema.sql b/Users/jbabcock/repositories/Lesserwrong/alt-LessWrong2/schema/schema_to_accept.sql
 * index 8d642a25c9..655713fd11 100644
 * --- a/Users/jbabcock/repositories/Lesserwrong/alt-LessWrong2/schema/accepted_schema.sql
 * +++ b/Users/jbabcock/repositories/Lesserwrong/alt-LessWrong2/schema/schema_to_accept.sql
 * @@ -4,5 +4,3 @@
 *  --
 * --- Overall schema hash: 5fb909476a7c6ef9567f7efb1abd005f
 * -
 * --- Accepted on 2024-03-16T00:25:00.000Z by 20240316T002500.add_CurationEmails_table.ts
 * +-- Overall schema hash: 22ccbc8a4a9ad5a0c0308f996f79ef0b
 *  
 * @@ -31,2 +29,14 @@ CREATE TABLE "AdvisorRequests" (
 *  
 * +-- Schema for "ArbitalCaches", hash: 1a82bece3c7ebfc2c84dc38779fcdbfd
 * +CREATE TABLE "ArbitalCaches" (
 * +    _id varchar(27) PRIMARY KEY,
 * +    "pageAlias" text NOT NULL,
 * +    "title" text NOT NULL,
 * +    "fetchedAt" timestamptz NOT NULL,
 * +    "sanitizedHtml" text NOT NULL,
 * +    "schemaVersion" double precision NOT NULL DEFAULT 1,
 * +    "createdAt" timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
 * +    "legacyData" jsonb
 * +);
 * +
 *  -- Schema for "Bans", hash: 85e3d29ad4d1fe9da07e91ac13e29cff
 * 
 * -------------------------------------------
 * (run `git diff --no-index schema/accepted_schema.sql schema/schema_to_accept.sql` to see this more clearly)
 *
 * - [ ] Write a migration to represent these changes
 * - [ ] Rename this file to something more readable
 * - [ ] Uncomment `acceptsSchemaHash` below
 * - [ ] Run `yarn acceptmigrations` to update the accepted schema hash (running makemigrations again will also do this)
 */
export const acceptsSchemaHash = "22ccbc8a4a9ad5a0c0308f996f79ef0b";

export const up = async ({db}: MigrationContext) => {
  await createTable(db, ArbitalCaches);
}

export const down = async ({db}: MigrationContext) => {
}
