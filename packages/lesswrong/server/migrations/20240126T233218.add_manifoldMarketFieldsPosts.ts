/**
 * Generated on 2024-01-26T23:32:18.561Z by `yarn makemigrations`
 * The following schema changes were detected:
 * -------------------------------------------
 * diff --git a/schema/accepted_schema.sql b/schema/schema_to_accept.sql
 * index 717d06c846..d60750e3ca 100644
 * --- a/schema/accepted_schema.sql
 * +++ b/schema/schema_to_accept.sql
 * @@ -4,5 +4,3 @@
 *  --
 * --- Overall schema hash: 7dbf024fc86645c003e6ca3f42cf3af5
 * -
 * --- Accepted on 2024-01-18T10:47:51.000Z by 20240118T104751.add_PostView_PostViewTimes.ts
 * +-- Overall schema hash: bf5c33d1f46ea5444810c9f48d5a39f0
 *  
 * @@ -568,4 +566,4 @@ CREATE TABLE "Notifications" (
 *  
 * --- Schema for "PageCache", hash: df93df381ba889d98a725ab76854eac7
 * -CREATE TABLE "PageCache" (
 * +-- Schema for "PageCache", hash: e912e37a4191e1dd2ccbc2360a06acf7
 * +CREATE UNLOGGED TABLE "PageCache" (
 *      _id varchar(27) PRIMARY KEY,
 * @@ -686,3 +684,3 @@ CREATE TABLE "PostViews" (
 *  
 * --- Schema for "Posts", hash: 34f525156e944ed443d26e4b60b443e9
 * +-- Schema for "Posts", hash: 5ea2dc09a9351c67a7a3e2355affbf3e
 *  CREATE TABLE "Posts" (
 * @@ -723,2 +721,4 @@ CREATE TABLE "Posts" (
 *      "positiveReviewVoteCount" double precision NOT NULL DEFAULT 0,
 * +    "manifoldReviewMarketId" text,
 * +    "annualReviewMarketCommentId" varchar(27),
 *      "reviewVoteScoreAF" double precision NOT NULL DEFAULT 0,
 * 
 * -------------------------------------------
 */
export const acceptsSchemaHash = "bf5c33d1f46ea5444810c9f48d5a39f0";

import { Posts } from "../../lib/collections/posts"
import { addField, dropField } from "./meta/utils"

export const up = async ({db}: MigrationContext) => {
  await addField(db, Posts, "manifoldReviewMarketId")
  await addField(db, Posts, "annualReviewMarketCommentId")
}

export const down = async ({db}: MigrationContext) => {
  await dropField(db, Posts, "manifoldReviewMarketId")
  await dropField(db, Posts, "annualReviewMarketCommentId")
}
