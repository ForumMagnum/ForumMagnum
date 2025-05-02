/**
 * Generated on 2023-01-18T11:41:57.699Z by `yarn makemigrations`
 * The following schema changes were detected:
 * -------------------------------------------
 * diff --git a/Users/wh/Documents/code/ForumMagnum/schema/accepted_schema.sql b/Users/wh/Documents/code/ForumMagnum/schema/schema_to_accept.sql
 * index 6cdeccd7d3..cc42609a9c 100644
 * --- a/Users/wh/Documents/code/ForumMagnum/schema/accepted_schema.sql
 * +++ b/Users/wh/Documents/code/ForumMagnum/schema/schema_to_accept.sql
 * @@ -4,5 +4,3 @@
 *  --
 * --- Overall schema hash: d92682d72d3bee6deb63b3b6419e027c
 * -
 * --- Accepted on 2023-01-18T10:42:29.000Z by 20230118T104229.add_subforumIntroPostId.ts
 * +-- Overall schema hash: 03021ec2d4dbdcefd4873d9df9f2f4a1
 *  
 * @@ -847,3 +845,3 @@ CREATE TABLE "UserMostValuablePosts" (
 *  
 * --- Schema for "UserTagRels", hash: 85597cdd16a3c5710b385372bf88124d
 * +-- Schema for "UserTagRels", hash: fe902c9d54ff7c5f70cec9f02027035a
 *  CREATE TABLE "UserTagRels" (
 * @@ -856,2 +854,3 @@ CREATE TABLE "UserTagRels" (
 *      "subforumHideIntroPost" bool DEFAULT false,
 * +    "subforumPreferredLayout" text NOT NULL DEFAULT true,
 *      "schemaVersion" double precision DEFAULT 1,
 * 
 * -------------------------------------------
 * (run `git diff --no-index schema/accepted_schema.sql schema/schema_to_accept.sql` to see this more clearly)
 *
 * - [ ] Write a migration to represent these changes
 * - [ ] Rename this file to something more readable if you wish
 * - [ ] Uncomment `acceptsSchemaHash` below
 * - [ ] Run `yarn acceptmigrations` to update the accepted schema hash (running makemigrations again will also do this)
 */
export const acceptsSchemaHash = "707023204349d37156630a9823919f65";

import Users from "../../server/collections/users/collection";
import { addField, dropField } from "./meta/utils";

export const up = async ({db}: MigrationContext) => {
  await addField(db, Users, "subforumPreferredLayout");
}

export const down = async ({db}: MigrationContext) => {
  await dropField(db, Users, "subforumPreferredLayout");
}
