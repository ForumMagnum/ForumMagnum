/**
 * Generated on 2023-03-24T20:38:35.710Z by `yarn makemigrations`
 * The following schema changes were detected:
 * -------------------------------------------
 * diff --git a/Users/sarah/EAForum/schema/accepted_schema.sql b/Users/sarah/EAForum/schema/schema_to_accept.sql
 * index 3cf95ce1cd..bbdd0cb31b 100644
 * --- a/Users/sarah/EAForum/schema/accepted_schema.sql
 * +++ b/Users/sarah/EAForum/schema/schema_to_accept.sql
 * @@ -4,5 +4,3 @@
 *  --
 * --- Overall schema hash: 9cc5aad21f36f801d9ce6b9e9e3ce213
 * -
 * --- Accepted on 2023-03-14T15:22:03.000Z by 20230314T152203.add_backfilled.ts
 * +-- Overall schema hash: f2971e1eafbc7d6a6939247b6aa9e0ba
 *  
 * @@ -458,3 +456,3 @@ CREATE TABLE "PostRelations" (
 *  
 * --- Schema for "Posts", hash: fa147c255ec4cd729e027b5554be0b54
 * +-- Schema for "Posts", hash: b060fd003f683bb48069b532a7778703
 *  CREATE TABLE "Posts" (
 * @@ -588,2 +586,3 @@ CREATE TABLE "Posts" (
 *      "commentCount" double precision DEFAULT 0,
 * +    "topLevelCommentCount" double precision DEFAULT 0,
 *      "subforumTagId" varchar(27),
 * 
 * -------------------------------------------
 * (run `git diff --no-index schema/accepted_schema.sql schema/schema_to_accept.sql` to see this more clearly)
 *
 * - [ ] Write a migration to represent these changes
 * - [ ] Rename this file to something more readable
 * - [ ] Uncomment `acceptsSchemaHash` below
 * - [ ] Run `yarn acceptmigrations` to update the accepted schema hash (running makemigrations again will also do this)
 */
export const acceptsSchemaHash = "f2971e1eafbc7d6a6939247b6aa9e0ba";

import Posts from "../../lib/collections/posts/collection"
import { addField, dropField } from "./meta/utils"

export const up = async ({db}: MigrationContext) => {
  if (!Posts.isPostgres()) {
    return
  }
  
  await addField(db, Posts, "topLevelCommentCount")
}

export const down = async ({db}: MigrationContext) => {
  if (!Posts.isPostgres()) {
    return
  }
  
  await dropField(db, Posts, "topLevelCommentCount")
}
