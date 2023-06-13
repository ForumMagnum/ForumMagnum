/**
 * Generated on 2023-06-12T19:55:21.752Z by `yarn makemigrations`
 * The following schema changes were detected:
 * -------------------------------------------
 * diff --git a/Users/sarah/EAForum/schema/accepted_schema.sql b/Users/sarah/EAForum/schema/schema_to_accept.sql
 * index a66567b398..d322ca6bf1 100644
 * --- a/Users/sarah/EAForum/schema/accepted_schema.sql
 * +++ b/Users/sarah/EAForum/schema/schema_to_accept.sql
 * @@ -4,5 +4,3 @@
 *  --
 * --- Overall schema hash: 8f9b37b6b8213a24c21dba39e77f7bbb
 * -
 * --- Accepted on 2023-06-09T10:00:00.000Z by 20230609T100000.add_PageCache.ts
 * +-- Overall schema hash: a9e4ae51c937678ad30ee19476819a97
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
 * +-- Schema for "Digests", hash: 577e81b23ebf1c6ca61e0ef14b9f0be3
 * +CREATE TABLE "Digests" (
 * +    _id varchar(27) PRIMARY KEY,
 * +    "num" double precision,
 * +    "startDate" timestamptz,
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
// export const acceptsSchemaHash = "a9e4ae51c937678ad30ee19476819a97";

import DigestPosts from "../../lib/collections/digestPosts/collection"
import Digests from "../../lib/collections/digests/collection"
import { randomId } from "../../lib/random"
import InsertQuery from "../../lib/sql/InsertQuery"
import { createTable, dropTable } from "./meta/utils"

export const up = async ({db}: MigrationContext) => {
  if (!Digests.isPostgres() || !DigestPosts.isPostgres()) return

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
  const query = new InsertQuery(Digests.table, newDigest as DbDigest)
  const {sql, args} = query.compile()
  await db.none(sql, args)
}

export const down = async ({db}: MigrationContext) => {
  if (!Digests.isPostgres() || !DigestPosts.isPostgres()) return

  await dropTable(db, DigestPosts)
  await dropTable(db, Digests)
}
