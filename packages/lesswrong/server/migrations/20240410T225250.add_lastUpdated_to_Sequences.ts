/**
 * Generated on 2024-04-10T22:52:50.878Z by `yarn makemigrations`
 * The following schema changes were detected:
 * -------------------------------------------
 * diff --git a/Users/sarah/EAForum/schema/accepted_schema.sql b/Users/sarah/EAForum/schema/schema_to_accept.sql
 * index 2374f33c64..dd07219315 100644
 * --- a/Users/sarah/EAForum/schema/accepted_schema.sql
 * +++ b/Users/sarah/EAForum/schema/schema_to_accept.sql
 * @@ -4,5 +4,3 @@
 *  --
 * --- Overall schema hash: 972b9de45fa85223bdb3e607bd8d9936
 * -
 * --- Accepted on 2024-04-09T16:32:58.000Z by 20240409T163258.noop_reorder_sequence_fields.ts
 * +-- Overall schema hash: b2d46df0cf4693fc419953f2fbe9a0cc
 *  
 * @@ -1047,5 +1045,6 @@ CREATE TABLE "Revisions" (
 *  
 * --- Schema for "Sequences", hash: 207c3d29adfca07c66abf0b47fc787e4
 * +-- Schema for "Sequences", hash: 5005c2911b5dba8ccfdb87c459edbec4
 *  CREATE TABLE "Sequences" (
 *      _id varchar(27) PRIMARY KEY,
 * +    "lastUpdated" timestamptz NOT NULL,
 *      "userId" varchar(27) NOT NULL,
 * 
 * -------------------------------------------
 * (run `git diff --no-index schema/accepted_schema.sql schema/schema_to_accept.sql` to see this more clearly)
 *
 * - [ ] Write a migration to represent these changes
 * - [ ] Rename this file to something more readable
 * - [ ] Uncomment `acceptsSchemaHash` below
 * - [ ] Run `yarn acceptmigrations` to update the accepted schema hash (running makemigrations again will also do this)
 */
export const acceptsSchemaHash = "b2d46df0cf4693fc419953f2fbe9a0cc";

import Sequences from "../../server/collections/sequences/collection"
import { dropField } from "./meta/utils"

export const up = async ({db}: MigrationContext) => {
  await db.none(
    `ALTER TABLE "Sequences" ADD COLUMN IF NOT EXISTS "lastUpdated" timestamptz`
  )
  await db.none(
    `UPDATE "Sequences" SET "lastUpdated" = "createdAt" WHERE "lastUpdated" IS NULL`
  )
  await db.none(
    `ALTER TABLE "Sequences" ALTER COLUMN "lastUpdated" SET NOT NULL`
  )
}

export const down = async ({db}: MigrationContext) => {
  await dropField(db, Sequences, "lastUpdated")
}
