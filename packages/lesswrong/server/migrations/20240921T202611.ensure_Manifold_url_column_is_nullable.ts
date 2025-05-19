/**
 * Generated on 2024-09-21T20:26:11.951Z by `yarn makemigrations`
 * The following schema changes were detected:
 * -------------------------------------------
 * diff --git a/Users/robert/Documents/repos/ForumMagnum/schema/accepted_schema.sql b/Users/robert/Documents/repos/ForumMagnum/schema/schema_to_accept.sql
 * index b1b9ab19d8..432daf34c1 100644
 * --- a/Users/robert/Documents/repos/ForumMagnum/schema/accepted_schema.sql
 * +++ b/Users/robert/Documents/repos/ForumMagnum/schema/schema_to_accept.sql
 * @@ -4,5 +4,3 @@
 *  --
 * --- Overall schema hash: e766c875e6c9911dcdd77f9a20a3c9c8
 * -
 * --- Accepted on 2024-09-18T04:57:29.000Z by 20240918T045729.add_criticismTipsDismissed_to_Users.ts
 * +-- Overall schema hash: 16016945b35edcc8c5df47e292005a22
 *  
 * @@ -1113,3 +1111,3 @@ CREATE INDEX IF NOT EXISTS "idx_Localgroups_isOnline_inactive_deleted_name" ON "
 *  
 * --- Table "ManifoldProbabilitiesCaches", hash 563fc299b47eb6ce33f5f8d91b621a42
 * +-- Table "ManifoldProbabilitiesCaches", hash 4a86ab78d9d193fa7f4e579fca312972
 *  CREATE UNLOGGED TABLE "ManifoldProbabilitiesCaches" (
 * @@ -1121,3 +1119,3 @@ CREATE UNLOGGED TABLE "ManifoldProbabilitiesCaches" (
 *    "lastUpdated" TIMESTAMPTZ NOT NULL,
 * -  "url" TEXT NOT NULL,
 * +  "url" TEXT,
 *    "schemaVersion" DOUBLE PRECISION NOT NULL DEFAULT 1,
 * 
 * -------------------------------------------
 * (run `git diff --no-index schema/accepted_schema.sql schema/schema_to_accept.sql` to see this more clearly)
 *
 * - [ ] Write a migration to represent these changes
 * - [ ] Rename this file to something more readable
 * - [ ] Uncomment `acceptsSchemaHash` below
 * - [ ] Run `yarn acceptmigrations` to update the accepted schema hash (running makemigrations again will also do this)
 */
export const acceptsSchemaHash = "16016945b35edcc8c5df47e292005a22";

import ManifoldProbabilitiesCaches from "@/server/collections/manifoldProbabilitiesCaches/collection"
import { addField } from "./meta/utils"

export const up = async ({db}: MigrationContext) => {
  await addField(db, ManifoldProbabilitiesCaches, 'url');

  await db.none(`ALTER TABLE "ManifoldProbabilitiesCaches" ALTER COLUMN "url" DROP NOT NULL`);
}

export const down = async ({db}: MigrationContext) => {
  // TODO, not required
}
