/**
 * Generated on 2022-12-06T19:42:43.108Z by `yarn makemigrations`
 * The following schema changes were detected:
 * -------------------------------------------
 * diff --git a/Users/raymondarnold/Dropbox/Mac2/Documents/LessWrongSuite/Lesswrong2/schema/accepted_schema.sql b/Users/raymondarnold/Dropbox/Mac2/Documents/LessWrongSuite/Lesswrong2/schema/schema_to_accept.sql
 * index dc30da73f4..bb14c0cb94 100644
 * --- a/Users/raymondarnold/Dropbox/Mac2/Documents/LessWrongSuite/Lesswrong2/schema/accepted_schema.sql
 * +++ b/Users/raymondarnold/Dropbox/Mac2/Documents/LessWrongSuite/Lesswrong2/schema/schema_to_accept.sql
 * @@ -4,5 +4,3 @@
 *  --
 * --- Overall schema hash: 84ce55cce528e97d831629f3adf9c4eb
 * -
 * --- Accepted on 2022-10-21T09:19:15.000Z by 20221021T091915.schema_hash.ts
 * +-- Overall schema hash: 22bf6d65631e3efb681c9cbea6213033
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
export const acceptsSchemaHash = "22bf6d65631e3efb681c9cbea6213033";

export const up = async ({db}: MigrationContext) => {
  // TODO
}

export const down = async ({db}: MigrationContext) => {
  // TODO, not required
}
