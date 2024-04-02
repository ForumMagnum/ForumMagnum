/**
 * Generated on 2024-04-02T16:52:15.521Z by `yarn makemigrations`
 * The following schema changes were detected:
 * -------------------------------------------
 * diff --git a/Users/sarah/EAForum/schema/accepted_schema.sql b/Users/sarah/EAForum/schema/schema_to_accept.sql
 * index bc3caa15c0..105676e279 100644
 * --- a/Users/sarah/EAForum/schema/accepted_schema.sql
 * +++ b/Users/sarah/EAForum/schema/schema_to_accept.sql
 * @@ -4,5 +4,3 @@
 *  --
 * --- Overall schema hash: 15e67a7cabc41723b3215bcb7dc9488e
 * -
 * --- Accepted on 2024-03-29T22:11:18.000Z by 20240329T221118.add_notificationSubscribedSequencePost_to_Users.ts
 * +-- Overall schema hash: 3b10e788a0f9632efcf3636b3fc70fd1
 *  
 * @@ -1036,3 +1034,3 @@ CREATE TABLE "Revisions" (
 *  
 * --- Schema for "Sequences", hash: 8a96ad51dff8003d4ee2b3f80858ba53
 * +-- Schema for "Sequences", hash: 207c3d29adfca07c66abf0b47fc787e4
 *  CREATE TABLE "Sequences" (
 * @@ -1041,11 +1039,11 @@ CREATE TABLE "Sequences" (
 *      "title" text NOT NULL,
 * -    "gridImageId" text,
 *      "bannerImageId" text,
 * -    "curatedOrder" double precision,
 * -    "userProfileOrder" double precision,
 * +    "gridImageId" text,
 * +    "hideFromAuthorPage" bool NOT NULL DEFAULT false,
 *      "draft" bool NOT NULL DEFAULT false,
 *      "isDeleted" bool NOT NULL DEFAULT false,
 * +    "curatedOrder" double precision,
 * +    "userProfileOrder" double precision,
 *      "canonicalCollectionSlug" text,
 *      "hidden" bool NOT NULL DEFAULT false,
 * -    "hideFromAuthorPage" bool NOT NULL DEFAULT false,
 *      "noindex" bool NOT NULL DEFAULT false,
 * 
 * -------------------------------------------
 * (run `git diff --no-index schema/accepted_schema.sql schema/schema_to_accept.sql` to see this more clearly)
 *
 * - [ ] Write a migration to represent these changes
 * - [ ] Rename this file to something more readable
 * - [ ] Uncomment `acceptsSchemaHash` below
 * - [ ] Run `yarn acceptmigrations` to update the accepted schema hash (running makemigrations again will also do this)
 */
export const acceptsSchemaHash = "3b10e788a0f9632efcf3636b3fc70fd1";

export const up = async ({db}: MigrationContext) => {
  // TODO
}

export const down = async ({db}: MigrationContext) => {
  // TODO, not required
}
