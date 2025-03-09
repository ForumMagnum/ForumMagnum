/**
 * Generated on 2023-05-02T08:32:10.448Z by `yarn makemigrations`
 * The following schema changes were detected:
 * -------------------------------------------
 * diff --git a/Users/wh/Documents/code/ForumMagnum/schema/accepted_schema.sql b/Users/wh/Documents/code/ForumMagnum/schema/schema_to_accept.sql
 * index 59c1109f8a..728152c056 100644
 * --- a/Users/wh/Documents/code/ForumMagnum/schema/accepted_schema.sql
 * +++ b/Users/wh/Documents/code/ForumMagnum/schema/schema_to_accept.sql
 * @@ -4,5 +4,3 @@
 *  --
 * --- Overall schema hash: c4afbf05797c266012f5ba5ae0119c87
 * -
 * --- Accepted on 2023-04-24T20:04:07.000Z by 20230424T200407.add_ignore_rate_limits.ts
 * +-- Overall schema hash: 891712d4139cf4505db4fc393acd3332
 *  
 * @@ -108,3 +106,3 @@ CREATE TABLE "CommentModeratorActions" (
 *  
 * --- Schema for "Comments", hash: 1a34920ecad5fd219e1d13d6025f4839
 * +-- Schema for "Comments", hash: 7d8b2ae046e14a393e9d6ab86db08331
 *  CREATE TABLE "Comments" (
 * @@ -129,2 +127,3 @@ CREATE TABLE "Comments" (
 *      "shortform" bool,
 * +    "shortformFrontpage" bool,
 *      "nominatedForReview" text,
 * 
 * -------------------------------------------
 * (run `git diff --no-index schema/accepted_schema.sql schema/schema_to_accept.sql` to see this more clearly)
 *
 * - [ ] Write a migration to represent these changes
 * - [ ] Rename this file to something more readable
 * - [ ] Uncomment `acceptsSchemaHash` below
 * - [ ] Run `yarn acceptmigrations` to update the accepted schema hash (running makemigrations again will also do this)
 */
export const acceptsSchemaHash = "a85cc326da77f34b19140ca908956227";

import Comments from "../../server/collections/comments/collection"
import { addField, dropField } from "./meta/utils"

export const up = async ({db}: MigrationContext) => {
  await addField(db, Comments, 'shortformFrontpage')
}

export const down = async ({db}: MigrationContext) => {
  await dropField(db, Comments, 'shortformFrontpage')
}
