/**
 * Generated on 2023-06-14T18:28:37.144Z by `yarn makemigrations`
 * The following schema changes were detected:
 * -------------------------------------------
 * diff --git a/Users/sarah/EAForum/schema/accepted_schema.sql b/Users/sarah/EAForum/schema/schema_to_accept.sql
 * index a66567b398..34b03ccafa 100644
 * --- a/Users/sarah/EAForum/schema/accepted_schema.sql
 * +++ b/Users/sarah/EAForum/schema/schema_to_accept.sql
 * @@ -4,5 +4,3 @@
 *  --
 * --- Overall schema hash: 8f9b37b6b8213a24c21dba39e77f7bbb
 * -
 * --- Accepted on 2023-06-09T10:00:00.000Z by 20230609T100000.add_PageCache.ts
 * +-- Overall schema hash: 7abdde9662fea7114e47457ccdc6f4ad
 *  
 * @@ -237,2 +235,26 @@ CREATE TABLE "DebouncerEvents" (
 *  
 * +-- Schema for "DigestPosts", hash: fb8d9230b033323f61ec3b5039a2d588
 * +CREATE TABLE "DigestPosts" (
 * +    _id varchar(27) PRIMARY KEY,
 * +    "digestId" varchar(27),
 * +    "postId" varchar(27),
 * +    "emailDigestStatus" text,
 * +    "onsiteDigestStatus" text,
 * +    "schemaVersion" double precision DEFAULT 1,
 * +    "createdAt" timestamptz DEFAULT CURRENT_TIMESTAMP,
 * +    "legacyData" jsonb
 * +);
 * +
 * +-- Schema for "Digests", hash: 31e6e4f967d7ab635fcd70dfa3b62a8e
 * +CREATE TABLE "Digests" (
 * +    _id varchar(27) PRIMARY KEY,
 * +    "num" double precision NOT NULL,
 * +    "startDate" timestamptz NOT NULL,
 * +    "endDate" timestamptz,
 * +    "publishedDate" timestamptz,
 * +    "schemaVersion" double precision DEFAULT 1,
 * +    "createdAt" timestamptz DEFAULT CURRENT_TIMESTAMP,
 * +    "legacyData" jsonb
 * +);
 * +
 *  -- Schema for "EmailTokens", hash: e5ad1bb9271a861a3a69375cabb71b64
 * 
 * -------------------------------------------
 * (run `git diff --no-index schema/accepted_schema.sql schema/schema_to_accept.sql` to see this more clearly)
 *
 * - [ ] Write a migration to represent these changes
 * - [ ] Rename this file to something more readable
 * - [ ] Uncomment `acceptsSchemaHash` below
 * - [ ] Run `yarn acceptmigrations` to update the accepted schema hash (running makemigrations again will also do this)
 */
export const acceptsSchemaHash = "7abdde9662fea7114e47457ccdc6f4ad";

import DigestPosts from "../../server/collections/digestPosts/collection"
import Digests from "../../server/collections/digests/collection"
import { randomId } from "../../lib/random"
import InsertQuery from "../../server/sql/InsertQuery"
import { createTable, dropTable } from "./meta/utils"

export const up = async ({db}: MigrationContext) => {
  await createTable(db, Digests)
  await createTable(db, DigestPosts)

  // insert a digest to start
  const now = new Date()
  const newDigest = {
    _id: randomId(),
    num: 1,
    startDate: now,
    createdAt: now,
  }
  const query = new InsertQuery(Digests.getTable(), newDigest as DbDigest)
  const {sql, args} = query.compile()
  await db.none(sql, args)
}

export const down = async ({db}: MigrationContext) => {
  await dropTable(db, DigestPosts)
  await dropTable(db, Digests)
}
