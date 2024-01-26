import Books from "../../lib/collections/books/collection";
import { addField } from "./meta/utils";

/**
 * Generated on 2022-12-07T03:00:42.348Z by `yarn makemigrations`
 * The following schema changes were detected:
 * -------------------------------------------
 * diff --git a/Users/jpaddison/cea/Forum/ForumMagnum/schema/accepted_schema.sql b/Users/jpaddison/cea/Forum/ForumMagnum/schema/schema_to_accept.sql
 * index 9a0e4839d1..0bfb2fd389 100644
 * --- a/Users/jpaddison/cea/Forum/ForumMagnum/schema/accepted_schema.sql
 * +++ b/Users/jpaddison/cea/Forum/ForumMagnum/schema/schema_to_accept.sql
 * @@ -4,5 +4,3 @@
 *  --
 * --- Overall schema hash: 84ce55cce528e97d831629f3adf9c4eb
 * -
 * --- Accepted on 2022-10-21T09:19:15.000Z by 20221021T091915.schema_hash.ts
 * +-- Overall schema hash: dc1ea5409f03e1b22c4c5835fd70e2a3
 *  
 * @@ -33,3 +31,3 @@ CREATE TABLE "Bans" (
 *  
 * --- Schema for "Books", hash: f7c58c313404e4c7f3e8dcd4406628e3
 * +-- Schema for "Books", hash: 2f345cb7645938cddd3470978f9825d2
 *  CREATE TABLE "Books" (
 * @@ -39,2 +37,3 @@ CREATE TABLE "Books" (
 *      "subtitle" text,
 * +    "tocTitle" text,
 *      "collectionId" varchar(27) NOT NULL,
 * 
 * -------------------------------------------
 * (run `git diff --no-index schema/accepted_schema.sql schema/schema_to_accept.sql` to see this more clearly)
 *
 * - [ ] Write a migration to represent these changes
 * - [ ] Rename this file to something more readable if you wish
 * - [ ] Uncomment `acceptsSchemaHash` below
 * - [ ] Run `yarn acceptmigrations` to update the accepted schema hash (running makemigrations again will also do this)
 */
export const acceptsSchemaHash = "346664785a7ca60371b76fd9d92a4f30";

export const up = async ({db}: MigrationContext) => {
  await addField(db, Books, "tocTitle");
}
