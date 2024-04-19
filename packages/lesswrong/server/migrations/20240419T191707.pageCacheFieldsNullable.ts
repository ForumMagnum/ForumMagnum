/**
 * Generated on 2024-04-19T19:17:07.202Z by `yarn makemigrations`
 * The following schema changes were detected:
 * -------------------------------------------
 * diff --git a/Users/jbabcock/repositories/Lesserwrong/LessWrong2/schema/accepted_schema.sql b/Users/jbabcock/repositories/Lesserwrong/LessWrong2/schema/schema_to_accept.sql
 * index 039846b69b..8a83d36974 100644
 * --- a/Users/jbabcock/repositories/Lesserwrong/LessWrong2/schema/accepted_schema.sql
 * +++ b/Users/jbabcock/repositories/Lesserwrong/LessWrong2/schema/schema_to_accept.sql
 * @@ -4,5 +4,3 @@
 *  --
 * --- Overall schema hash: 8365aace030196807258e6ab633a5466
 * -
 * --- Accepted on 2024-04-16T15:17:09.000Z by 20240416T151709.drop_Users_wrapped2023Viewed_experiencedIn_interestedIn.ts
 * +-- Overall schema hash: 6eb42ab6368c0cdaabb561ed38e6814c
 *  
 * @@ -635,3 +633,3 @@ CREATE TABLE "Notifications" (
 *  
 * --- Schema for "PageCache", hash: e912e37a4191e1dd2ccbc2360a06acf7
 * +-- Schema for "PageCache", hash: 5e2fb62606bbbb413ad604f12216a10a
 *  CREATE UNLOGGED TABLE "PageCache" (
 * @@ -641,6 +639,6 @@ CREATE UNLOGGED TABLE "PageCache" (
 *      "bundleHash" text NOT NULL,
 * -    "renderedAt" timestamptz NOT NULL,
 * +    "renderedAt" timestamptz,
 *      "expiresAt" timestamptz NOT NULL,
 *      "ttlMs" double precision NOT NULL,
 * -    "renderResult" jsonb NOT NULL,
 * +    "renderResult" jsonb,
 *      "schemaVersion" double precision NOT NULL DEFAULT 1,
 * 
 * -------------------------------------------
 * (run `git diff --no-index schema/accepted_schema.sql schema/schema_to_accept.sql` to see this more clearly)
 *
 * - [ ] Write a migration to represent these changes
 * - [ ] Rename this file to something more readable
 * - [ ] Uncomment `acceptsSchemaHash` below
 * - [ ] Run `yarn acceptmigrations` to update the accepted schema hash (running makemigrations again will also do this)
 */
// export const acceptsSchemaHash = "6eb42ab6368c0cdaabb561ed38e6814c";

import PageCache from "../../lib/collections/pagecache/collection";
import { makeColumnNotNullable, makeColumnNullable } from "./meta/utils";

export const up = async ({db}: MigrationContext) => {
  await makeColumnNullable(db, PageCache, "renderedAt");
  await makeColumnNullable(db, PageCache, "renderResult");
}

export const down = async ({db}: MigrationContext) => {
  await makeColumnNotNullable(db, PageCache, "renderedAt");
  await makeColumnNotNullable(db, PageCache, "renderResult");
}
