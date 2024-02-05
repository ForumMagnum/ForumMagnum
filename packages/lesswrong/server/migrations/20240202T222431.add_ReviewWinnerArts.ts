/**
 * Generated on 2024-02-02T22:24:31.504Z by `yarn makemigrations`
 * The following schema changes were detected:
 * -------------------------------------------
 * diff --git a/Users/rickiheicklen/Development/Github/lesswrong/ForumMagnum/schema/accepted_schema.sql b/Users/rickiheicklen/Development/Github/lesswrong/ForumMagnum/schema/schema_to_accept.sql
 * index e219703db6..bd80162019 100644
 * --- a/Users/rickiheicklen/Development/Github/lesswrong/ForumMagnum/schema/accepted_schema.sql
 * +++ b/Users/rickiheicklen/Development/Github/lesswrong/ForumMagnum/schema/schema_to_accept.sql
 * @@ -4,5 +4,3 @@
 *  --
 * --- Overall schema hash: 7a02a320ce76de404e1d8cd5a8ad821e
 * -
 * --- Accepted on 2024-02-02T20:17:34.000Z by 20240202T201734.add_ReviewWinnerArt.ts
 * +-- Overall schema hash: 4f6d8b64174f9629c53ad65b5367b840
 *  
 * @@ -938,4 +936,4 @@ CREATE TABLE "ReviewVotes" (
 *  
 * --- Schema for "ReviewWinnerArt", hash: b0a9369bb7a1c224b83d4edb65607dc3
 * -CREATE TABLE "ReviewWinnerArt" (
 * +-- Schema for "ReviewWinnerArts", hash: c14609ce9264d2d9c5860bd52ea7a8cb
 * +CREATE TABLE "ReviewWinnerArts" (
 *      _id varchar(27) PRIMARY KEY,
 * @@ -943,3 +941,2 @@ CREATE TABLE "ReviewWinnerArt" (
 *      "reviewYear" double precision NOT NULL,
 * -    "curatedOrder" double precision NOT NULL,
 *      "reviewRanking" double precision NOT NULL,
 * 
 * -------------------------------------------
 * (run `git diff --no-index schema/accepted_schema.sql schema/schema_to_accept.sql` to see this more clearly)
 *
 * - [ ] Write a migration to represent these changes
 * - [ ] Rename this file to something more readable
 * - [ ] Uncomment `acceptsSchemaHash` below
 * - [ ] Run `yarn acceptmigrations` to update the accepted schema hash (running makemigrations again will also do this)
 */
export const acceptsSchemaHash = "4f6d8b64174f9629c53ad65b5367b840";

import ReviewWinnerArts from "../../lib/collections/reviewWinnerArts/collection"
import { createTable, dropTable } from "./meta/utils"

export const up = async ({db}: MigrationContext) => {
  await createTable(db, ReviewWinnerArts);
}

export const down = async ({db}: MigrationContext) => {
  await dropTable(db, ReviewWinnerArts);
}

