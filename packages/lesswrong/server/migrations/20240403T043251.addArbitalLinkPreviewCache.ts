/**
 * Generated on 2024-02-15T23:13:00.334Z by `yarn makemigrations`
 * The following schema changes were detected:
 * -------------------------------------------
 * diff --git a/Users/jbabcock/repositories/Lesserwrong/alt-LessWrong2/schema/accepted_schema.sql b/Users/jbabcock/repositories/Lesserwrong/alt-LessWrong2/schema/schema_to_accept.sql
 * index 76ef015cd0..776538e0b5 100644
 * --- a/Users/jbabcock/repositories/Lesserwrong/alt-LessWrong2/schema/accepted_schema.sql
 * +++ b/Users/jbabcock/repositories/Lesserwrong/alt-LessWrong2/schema/schema_to_accept.sql
 * @@ -4,5 +4,3 @@
 *  --
 * --- Overall schema hash: 92b57599e36ee19757a1e763216509c5
 * -
 * --- Accepted on 2024-02-13T22:27:00.000Z by 20240213T222700.add_notificationSubscribedUserComment_to_Users.ts
 * +-- Overall schema hash: 1cca53989f92d593c9cb80c2e9e8b5a3
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
export const acceptsSchemaHash = "1cca53989f92d593c9cb80c2e9e8b5a3";

import ArbitalCaches from "../../lib/collections/arbitalCache/collection";
import { createTable } from "./meta/utils"

export const up = async ({db}: MigrationContext) => {
  await createTable(db, ArbitalCaches, true);
}

export const down = async ({db}: MigrationContext) => {
}
